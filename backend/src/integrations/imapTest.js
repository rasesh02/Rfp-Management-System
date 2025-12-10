import Imap from 'imap-simple';

const config = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 30000,
    tlsOptions: { rejectUnauthorized: false } // <-- add this line
  }
};

Imap.connect(config).then(async connection => {
  await connection.openBox('INBOX');
  const searchCriteria = ['ALL'];
  const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'] };
  const results = await connection.search(searchCriteria, fetchOptions);
  console.log('Results:', results);
  await connection.end();
}).catch(err => {
  console.error('IMAP test error:', err);
});