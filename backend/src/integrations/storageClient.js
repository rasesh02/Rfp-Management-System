// src/integrations/storageClient.js
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

let useS3 = false;
const S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || null;
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null;

let s3Client = null;
if (S3_BUCKET && AWS_REGION) {
  try {
    // lazy import so code still works without aws-sdk installed (local fallback)
    const { S3Client } = await import('@aws-sdk/client-s3');
    s3Client = new S3Client({ region: AWS_REGION });
    useS3 = true;
    console.log('storageClient: S3 enabled, bucket=', S3_BUCKET);
  } catch (err) {
    console.warn('storageClient: AWS SDK not available or failed to init — falling back to local fs. Error:', err && err.message ? err.message : err);
    useS3 = false;
  }
} else {
  console.log('storageClient: S3 not configured, using local storage fallback');
}

// Utility: sanitize filename
function sanitizeFilename(name = '') {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '-').slice(0, 240) || `file-${Date.now()}`;
}

function makeLocalUploadPath(filename) {
  const uploadsDir = path.join(process.cwd(), 'storage', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${sanitizeFilename(filename)}`;
  return path.join(uploadsDir, unique);
}

// Helper: stream -> buffer (for S3 GetObject response)
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * saveAttachment(bufferOrUint8Array, filename, contentType) -> returns url string
 * - If S3 is configured, uploads to S3 and returns the https URL.
 * - Otherwise writes to local ./storage/uploads and returns local file path.
 */
export async function saveAttachment(body, filename = `attachment-${Date.now()}`, contentType = 'application/octet-stream') {
  if (!body) throw new Error('saveAttachment requires body (Buffer or Uint8Array)');

  const safeName = sanitizeFilename(filename);

  // S3 path
  if (useS3 && s3Client) {
    try {
      const key = `attachments/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}`;
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const cmd = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      await s3Client.send(cmd);

      // Construct a standard S3 https URL (works for public buckets or presigned access)
      // Note: if your bucket is in a special region or uses custom domain, adjust accordingly.
      const url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
      return url;
    } catch (err) {
      console.error('storageClient.saveAttachment: S3 upload failed, falling back to local file. Error:', err && err.message ? err.message : err);
      // fallthrough to local
    }
  }

  // Local filesystem fallback
  try {
    const targetPath = makeLocalUploadPath(safeName);
    await fs.promises.writeFile(targetPath, body);
    return targetPath;
  } catch (err) {
    console.error('storageClient.saveAttachment: local write failed:', err && err.message ? err.message : err);
    throw err;
  }
}

/**
 * download(urlOrPath) -> Buffer
 * - If the URL looks like an S3 https url that we generate, will download via S3.
 * - Otherwise, tries to read as local file path.
 */
export async function download(urlOrPath) {
  if (!urlOrPath) throw new Error('download requires urlOrPath');

  // detect S3 https url created by saveAttachment
  const s3Match = useS3 && AWS_REGION && typeof urlOrPath === 'string' && urlOrPath.startsWith(`https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`);
  if (s3Match && s3Client) {
    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      // extract key after bucket domain
      const key = decodeURIComponent(urlOrPath.replace(`https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`, ''));
      const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
      const res = await s3Client.send(cmd);
      // res.Body is a stream (Node.js Readable)
      const buffer = await streamToBuffer(res.Body);
      return buffer;
    } catch (err) {
      console.error('storageClient.download: S3 download failed', err && err.message ? err.message : err);
      throw err;
    }
  }

  // fallback: local file read
  try {
    const filePath = String(urlOrPath);
    const buffer = await fs.promises.readFile(filePath);
    return buffer;
  } catch (err) {
    console.error('storageClient.download: local file read failed for', urlOrPath, err && err.message ? err.message : err);
    throw err;
  }
}

export default {
  saveAttachment,
  download
};
