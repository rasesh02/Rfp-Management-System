import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import sendEmailWorker from './src/workers/sendEmail.worker.js';

console.log('🚀 Starting Email Worker (send-rfp-emails queue)');
console.log('⏳ Waiting for jobs...');

sendEmailWorker.on('completed', job => {
  console.log(`✅ Job ${job.id} completed - RFP email sent`);
});

sendEmailWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

sendEmailWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down Email Worker...');
  await sendEmailWorker.close();
  process.exit(0);
});
