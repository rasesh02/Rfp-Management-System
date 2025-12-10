import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Keep your existing database and logic imports
import {client} from '../config/db.js';
import storageClient from './storageClient.js'; 
import { addJob } from '../jobs/proposalQueue.js';

const {
  IMAP_HOST,
  IMAP_PORT,
  IMAP_USER,
  IMAP_PASS,
  IMAP_TLS,
  IMAP_MAILBOX,
  IMAP_FETCH_BATCH_SIZE,
  IMAP_SINCE_DAYS
} = process.env;

const DEFAULT_POLL_SECONDS = 60;
const MAILBOX = IMAP_MAILBOX || 'INBOX';
// Default to port 993 (SSL) if not specified, or 143 if TLS is explicitly false
const PORT = IMAP_PORT ? parseInt(IMAP_PORT, 10) : (IMAP_TLS === 'false' ? 143 : 993);
const SECURE = IMAP_TLS !== 'false'; // Default to true for Gmail/Outlook
const BATCH_SIZE = Number(IMAP_FETCH_BATCH_SIZE || 10);
const SINCE_DAYS = Number(IMAP_SINCE_DAYS || 1);



// Sanitize message-id
function normalizeMessageId(mid) {
  if (!mid) return null;
  return String(mid).trim().replace(/^<|>$/g, '');
}

async function findRfpVendorByMessageId(messageId) {
  if (!messageId) return null;
  const mid = normalizeMessageId(messageId);
  const sql = `
    SELECT * FROM rfp_vendors
    WHERE email_message_id IS NOT NULL
      AND replace(replace(email_message_id, '<', ''), '>', '') = $1
    LIMIT 1;
  `;
  const res = await client.query(sql, [mid]);
  return res.rowCount > 0 ? res.rows[0] : null;
}

async function findRfpVendorByRfpIdAndVendorEmail(rfpId, vendorEmail) {
  if (!rfpId || !vendorEmail) return null;
  const sql = `
    SELECT rv.* FROM rfp_vendors rv
    JOIN vendors v ON v.id = rv.vendor_id
    WHERE rv.rfp_id = $1
      AND (lower(v.contact_email) = lower($2) OR lower(v.email) = lower($2))
    LIMIT 1;
  `;
  const res = await client.query(sql, [rfpId, vendorEmail]);
  return res.rowCount > 0 ? res.rows[0] : null;
}

async function saveAttachment(att) {
  try {
    if (storageClient && typeof storageClient.saveAttachment === 'function') {
      const s3url = await storageClient.saveAttachment(att.content, att.filename || `attach-${Date.now()}`, att.contentType);
      return {
        filename: att.filename || null,
        content_type: att.contentType || null,
        size: att.size || (att.content ? att.content.length : null),
        s3_url: s3url
      };
    } else {
      // Local fallback
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rfp-attach-'));
      const filePath = path.join(tmpDir, att.filename || `attach-${Date.now()}`);
      fs.writeFileSync(filePath, att.content);
      return {
        filename: att.filename || null,
        content_type: att.contentType || null,
        size: att.size || (att.content ? att.content.length : null),
        s3_url: filePath
      };
    }
  } catch (err) {
    console.error('Attachment save error:', err);
    return {
      filename: att.filename || null,
      content_type: att.contentType || null,
      size: att.size || (att.content ? att.content.length : null),
      s3_url: null,
      error: String(err)
    };
  }
}

function extractRfpIdFromText(text) {
  if (!text) return null;
  const urlMatch = text.match(/\/rfps?[\/\-]([0-9a-fA-F-]{6,36})/i);
  if (urlMatch) return urlMatch[1];
  const qMatch = text.match(/rfp[_-]?id[=:\s]*([0-9a-fA-F-]{6,36})/i);
  if (qMatch) return qMatch[1];
  const rMatch = text.match(/[Rr][Ff][Pp][\s:-]*([0-9a-fA-F-]{6,36})/);
  if (rMatch) return rMatch[1];
  return null;
}

/* =========================================================================
   2. CORE PROCESSING LOGIC (Refactored to take Parsed Email)
   ========================================================================= */

/**
 * Processes a parsed email object.
 * Returns { processed: boolean } - true if it was an RFP reply and stored.
 */
async function processParsedEmail(parsed, rawSource) {
  try {
    const fromAddr = (parsed.from && parsed.from.value && parsed.from.value[0] && parsed.from.value[0].address) || null;
    const subject = parsed.subject || null;
    const bodyText = parsed.text || parsed.html || '';
    const receivedAt = parsed.date || new Date();

    // Headers
    const headers = parsed.headers || new Map();
    // Helper to get header safely whether it's a Map or Object
    const getHeader = (key) => {
        if (headers instanceof Map) return headers.get(key);
        return headers[key];
    };

    const inReplyTo = parsed.inReplyTo || getHeader('in-reply-to');
    const xRfpId = getHeader('x-rfp-id');
    
    // Normalize references to array
    let references = parsed.references || getHeader('references');
    if (typeof references === 'string') {
        references = references.split(/\s+/).filter(Boolean);
    } else if (!Array.isArray(references)) {
        references = references ? [references] : [];
    }

    // --- Matching Logic ---
    let matchedRfpVendor = null;

    // 1. Try X-RFP-ID
    if (xRfpId && fromAddr) {
      matchedRfpVendor = await findRfpVendorByRfpIdAndVendorEmail(xRfpId, fromAddr);
    }

    // 2. Try In-Reply-To / References
    if (!matchedRfpVendor && (inReplyTo || references.length > 0)) {
      if (inReplyTo) {
        matchedRfpVendor = await findRfpVendorByMessageId(inReplyTo);
      }
      if (!matchedRfpVendor && references.length > 0) {
        for (const ref of references) {
            matchedRfpVendor = await findRfpVendorByMessageId(ref);
            if (matchedRfpVendor) break;
        }
      }
    }

    // 3. Try Text Heuristics (Subject/Body)
    if (!matchedRfpVendor) {
      const candidateRfpId = extractRfpIdFromText(`${subject || ''}\n${bodyText || ''}`);
      if (candidateRfpId && fromAddr) {
        matchedRfpVendor = await findRfpVendorByRfpIdAndVendorEmail(candidateRfpId, fromAddr);
      }
    }

    // IF NOT MATCHED, RETURN FALSE (So we don't save it)
    if (!matchedRfpVendor) {
      console.log(`[Processor] Email from ${fromAddr} ("${subject}") is NOT a recognized RFP reply.`);
      return { processed: false };
    }

    // --- It is a match! Save it. ---
    console.log(`[Processor] MATCH FOUND! RFP ID: ${matchedRfpVendor.rfp_id}, Vendor: ${matchedRfpVendor.vendor_id}`);

    // Save Attachments
    const attachmentMetas = [];
    if (parsed.attachments && parsed.attachments.length) {
      for (const att of parsed.attachments) {
        const meta = await saveAttachment(att);
        attachmentMetas.push(meta);
      }
    }

    // Prepare JSON for DB
    const rawAttachmentsJson = attachmentMetas.map(a => ({
      filename: a.filename,
      s3_url: a.s3_url,
      content_type: a.content_type,
      size: a.size
    }));

    // Insert Proposal
    const insertSql = `
      INSERT INTO proposals (rfp_id, vendor_id, raw_email, raw_attachments, received_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const insertParams = [
      matchedRfpVendor.rfp_id,
      matchedRfpVendor.vendor_id,
      rawSource, // The raw email text/buffer
      JSON.stringify(rawAttachmentsJson || []),
      receivedAt
    ];

    const res = await client.query(insertSql, insertParams);
    const insertedProposal = res.rows[0];
    console.log('Inserted proposal id=', insertedProposal.id);

    // Insert Attachment Rows
    if (insertedProposal && attachmentMetas.length) {
      for (const meta of attachmentMetas) {
        try {
          await client.query(
            `INSERT INTO attachments (proposal_id, filename, content_type, s3_url) VALUES ($1, $2, $3, $4)`,
            [insertedProposal.id, meta.filename, meta.content_type, meta.s3_url]
          );
        } catch (e) { console.error('Error inserting attachment row', e); }
      }
    }

    // Enqueue Parse Job
    if (insertedProposal) {
      await addJob(insertedProposal.id);
      console.log('Enqueued parse job for proposal.id=', insertedProposal.id);
    }

    return { processed: true, proposalId: insertedProposal.id };

  } catch (err) {
    console.error('Error in processParsedEmail:', err);
    return { processed: false, error: err };
  }
}

/* =========================================================================
   3. IMAP CLIENT & SCANNER (New Implementation with ImapFlow)
   ========================================================================= */

let _imapClient = null;
let _isScanning = false;

// Create the client instance
function createClient() {
    return new ImapFlow({
        host: IMAP_HOST,
        port: PORT,
        secure: SECURE,
        auth: {
            user: IMAP_USER,
            pass: IMAP_PASS
        },
        logger: false // Set to true if you want internal library logs
    });
}

export async function scanAndProcess(imapClient) {
    if (_isScanning) {
        console.log('[Scanner] Scan already in progress, skipping.');
        return;
    }
    _isScanning = true;

    // We must acquire a lock on the mailbox to perform operations
    let lock = await imapClient.getMailboxLock(MAILBOX);
    
    try {
        console.log(`[Scanner] Scanning ${MAILBOX}...`);

        // 1. Define Search Criteria
        let searchObj = { seen: false }; // UNSEEN
        if (SINCE_DAYS > 0) {
            const sinceDate = new Date(Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000);
            searchObj.since = sinceDate;
        }

        // 2. Fetch Messages (Generator)
        // fetchOne() or fetch() returns a generator. We iterate through it.
        // We request the 'source' so we can parse it fully.
        const messageStream = imapClient.fetch(searchObj, { 
            source: true, 
            uid: true, 
            envelope: true // Get basic headers to log/check before full parse if desired, but we need full parse for body checks
        });

        let processedCount = 0;
        let examinedCount = 0;

        // Iterate over messages found
        for await (const message of messageStream) {
            examinedCount++;
            
            // Limit batch processing if needed, though generator handles memory well
            if (examinedCount > BATCH_SIZE) {
                console.log(`[Scanner] Batch limit (${BATCH_SIZE}) reached. Stopping scan.`);
                break;
            }

            console.log(`[Scanner] Examining UID: ${message.uid} - Subject: ${message.envelope.subject}`);

            // Parse the raw source
            // message.source is a Buffer
            const parsed = await simpleParser(message.source);
            
            // Process
            const result = await processParsedEmail(parsed, message.source.toString('utf8'));

            if (result.processed) {
                console.log(`[Scanner] ✅ Successfully processed UID ${message.uid}. Marking as SEEN.`);
                
                // IMPORTANT: Mark as SEEN so we don't process it again
                await imapClient.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
                
                processedCount++;
                
                // Workflow Requirement: "Stop after first valid reply" (inherited from original code)
                console.log('[Scanner] Found a valid reply. Stopping scan for this cycle.');
                break; 
            } else {
                console.log(`[Scanner] ⏭️ UID ${message.uid} was not a match. Leaving UNSEEN.`);
                // We leave it UNSEEN so it stays in the inbox as "new" for the human, 
                // OR you can mark it seen if you want to skip it next time.
                // The original code implied we only touch valid RFP replies.
            }
        }

        console.log(`[Scanner] Cycle complete. Examined: ${examinedCount}, Processed: ${processedCount}`);

    } catch (err) {
        console.error('[Scanner] Error during scan:', err);
    } finally {
        // Always release the lock
        lock.release();
        _isScanning = false;
    }
}

export async function startImapClient(options = {}) {
    if (!IMAP_HOST || !IMAP_USER || !IMAP_PASS) {
        throw new Error('IMAP config missing (IMAP_HOST, IMAP_USER, IMAP_PASS).');
    }

    _imapClient = createClient();

    // Event: Client Ready
    _imapClient.on('ready', () => {
        console.log(`[IMAP] Connected to ${IMAP_HOST}:${PORT} as ${IMAP_USER}`);
    });

    // Event: Error
    _imapClient.on('error', (err) => {
        console.error('[IMAP] Client Error:', err);
    });

    // Event: Mailbox updates (New Email)
    // Note: 'exists' fires when message count changes.
    _imapClient.on('exists', async (data) => {
        console.log(`[IMAP] New mail event (Count: ${data.count}). Triggering scan...`);
        await scanAndProcess(_imapClient);
    });

    // Connect
    await _imapClient.connect();

    // Initial Scan
    scanAndProcess(_imapClient).catch(err => console.error('Initial scan failed:', err));

    // Periodic Polling (Fallback for idle connections)
    const pollInterval = (Number(options.pollSeconds) || DEFAULT_POLL_SECONDS) * 1000;
    const pollTimer = setInterval(async () => {
        if (!_imapClient.usable) {
            console.warn('[IMAP] Connection not usable, attempting reconnect...');
            try { await _imapClient.connect(); } catch (e) { /* ignore */ }
        }
        await scanAndProcess(_imapClient);
    }, pollInterval);

    return {
        stop: async () => {
            clearInterval(pollTimer);
            await _imapClient.logout();
        }
    };
}

// For backward compatibility with your import structure
export const handleMessage = async (rawMessage) => {
    // This helper is technically no longer used by the internal logic 
    // because we handle parsing inside scanAndProcess, 
    // but kept here if your code calls it externally.
    const parsed = await simpleParser(rawMessage);
    return processParsedEmail(parsed, rawMessage);
};

export default { startImapClient, handleMessage };