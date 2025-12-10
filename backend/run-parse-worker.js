import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import parseProposalWorker from './src/workers/parseProposal.worker.js';

console.log('🚀 Starting Parse Proposal Worker (parse-proposals queue)');
console.log('⏳ Waiting for jobs...');

parseProposalWorker.on('completed', job => {
  console.log(`✅ Job ${job.id} completed - Proposal parsed and scored`);
});

parseProposalWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

parseProposalWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down Parse Proposal Worker...');
  await parseProposalWorker.close();
  process.exit(0);
});
