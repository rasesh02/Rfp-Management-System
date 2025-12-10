// queues/emailQueue.js
import {Queue} from 'bullmq';
import IORedis from 'ioredis'

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis({ url: redisUrl, maxRetriesPerRequest: null });
console.log("✅ Email queue connected to Redis:", redisUrl);
const emailQueue = new Queue('send-rfp-emails', { connection });

console.log("📦 Email queue initialized");

/**
 * Add a job to the queue.
 * jobId should be unique per rfpVendor to avoid duplicates.
 */
export async function addJob(jobId, data, opts = {}) {
  // Default retry strategy
  const defaultOpts = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
    ...opts
  };
  try {
    const job = await emailQueue.add(jobId, data, defaultOpts);
    console.log(`📥 Job added to queue: ${jobId}`);
    return job;
  } catch (err) {
    console.error('❌ Failed to add job to queue:', err.message);
    throw err;
  }
}
