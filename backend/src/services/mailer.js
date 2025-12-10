// src/services/mailer.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import os from 'os';

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport(process.env.SMTP_URL || {
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_PORT == '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

/**
 * generate a simple RFC5322 message-id
 * tries crypto.randomUUID(); falls back to random hex
 */
function generateMessageId(domain) {
  const uuid = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');
  const host = domain || process.env.MAILER_MESSAGE_ID_DOMAIN || os.hostname() || 'localhost';
  const safeHost = String(host).trim().replace(/\s+/g, '-');
  return `<${uuid}@${safeHost}>`;
}

/**
 * sendWithNodemailer({ to, from, subject, html, text, rfpId, headers })
 * - rfpId optional: if provided it will add X-RFP-ID header
 * - headers optional: additional custom headers
 * returns { provider, messageId, info }
 */
async function sendWithNodemailer({ to, from, subject, html, text, rfpId = null, headers = {} } = {}) {
  // build headers
  headers = Object.assign({}, headers);

  // allow caller to provide Message-ID; otherwise generate one
  const providedMid = headers['Message-ID'] || headers['message-id'] || null;
  const messageId = providedMid || generateMessageId();

  // ensure both Message-ID header and nodemailer messageId option are set
  headers['Message-ID'] = messageId;

  // add X-RFP-ID header if rfpId provided
  if (rfpId) {
    headers['X-RFP-ID'] = String(rfpId);
  }

  try {
    const t = getTransporter();
    // nodemailer accepts messageId option; include headers as well
    const info = await t.sendMail({
      from,
      to,
      subject,
      html,
      text,
      headers,
      messageId // explicit option, nodemailer will use this as message-id
    });
    // info.messageId is commonly returned; use that if present, otherwise our generated one
    const returnedMessageId = (info && info.messageId) ? info.messageId : messageId;
    return { provider: 'nodemailer', messageId: returnedMessageId, info };
  } catch (error) {
    console.log("can't send mail via nodemailer:", error);
    throw error;
  }
}

export default sendWithNodemailer;
