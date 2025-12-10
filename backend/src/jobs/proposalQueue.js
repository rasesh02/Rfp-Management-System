// queues/emailQueue.js
import {Queue} from 'bullmq';
import IORedis from 'ioredis'

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis({ url: redisUrl, maxRetriesPerRequest: null });
console.log("✅ Proposal queue connected to Redis:", redisUrl);
const proposalQueue = new Queue('parse-proposals', { connection });

console.log("📦 Proposal queue initialized");

/**
 * Add a job to the queue.
 * proposalId: the proposal ID to parse
 */
export async function addJob(proposalId, opts = {}) {
  if (!proposalId) throw new Error('proposalId is required');
  const jobId = `parse_${proposalId}`;
  // Default retry strategy
  const defaultOpts = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
    ...opts
  };
  try {
    const job = await proposalQueue.add(jobId, { proposalId }, defaultOpts);
    console.log(`📥 Job added to queue: ${jobId}`);
    return job;
  } catch (err) {
    console.error('❌ Failed to add job to queue:', err.message);
    throw err;
  }
}

