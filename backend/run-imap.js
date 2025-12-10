import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import connectPostgres from './src/config/db.js';
import { startImapClient } from './src/integrations/imapClient.js';

(async () => {
  try {
    console.log('🚀 Starting IMAP Client...');
    
    // Connect to database first
    console.log('📡 Connecting to PostgreSQL...');
    await connectPostgres();
    console.log('✅ PostgreSQL connected');
    
    const clientRef = await startImapClient();
    console.log('✅ IMAP client started and listening for vendor replies');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n⏹️  Shutting down IMAP client...');
      try {
        await clientRef.stop();
        console.log('✅ IMAP client stopped');
      } catch (err) {
        console.error('Error stopping IMAP client:', err.message);
      }
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Failed to start IMAP client:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
})();
