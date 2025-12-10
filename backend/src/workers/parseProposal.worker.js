import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import connectPostgres from '../config/db.js';
import { saveParsedProposal } from '../services/proposalParse.service.js';

// Connect to database before processing jobs
await connectPostgres();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

console.log('✅ Parse Worker connected to Redis:', redisUrl);

const worker = new Worker(
	'parse-proposals',
	async job => {
		const { proposalId } = job.data;
		if (!proposalId) throw new Error('No proposalId in job data');

		// Parse and score proposal using new service
		try {
			console.log(`📝 Parsing proposal ${proposalId}...`);
			const result = await saveParsedProposal({ proposalId });
			console.log(`✅ Proposal ${proposalId} parsed and scored.`);
			return result;
		} catch (err) {
			console.error(`❌ Failed to process proposal ${proposalId}:`, err.message);
			throw err;
		}
	},
	{ connection }
);

worker.on('completed', job => {
	console.log(`✅ Job ${job.id} completed successfully`);
});
worker.on('failed', (job, err) => {
	console.error(`❌ Job ${job.id} failed:`, err.message);
});

export default worker;
