# Running RFP System with Separate Terminals

This setup allows you to run 4 separate processes for better logging and debugging.

## Setup Instructions

Open 4 terminals in the `backend` directory:

### Terminal 1: Main API Server
```bash
node src/index.js
```
**Output:** Starts Express API server on port 3000. Handles all REST endpoints.

### Terminal 2: Email Worker
```bash
node run-email-worker.js
```
**Output:** Listens for `send-rfp-emails` queue jobs. Sends RFP emails to vendors via Nodemailer.

### Terminal 3: Parse Proposal Worker
```bash
node run-parse-worker.js
```
**Output:** Listens for `parse-proposals` queue jobs. Parses vendor proposals using AI and stores results.

### Terminal 4: IMAP Client
```bash
node run-imap.js
```
**Output:** Continuously scans vendor email inbox for replies. Automatically enqueues parsing jobs when proposals are detected.

## Process Flow

1. **API Server** (Terminal 1) - Main application, exposes REST endpoints
2. **User creates RFP** via API → enqueues `send-rfp-emails` jobs
3. **Email Worker** (Terminal 2) - Picks up job and sends RFP emails to vendors
4. **IMAP Client** (Terminal 4) - Detects vendor email replies
5. **IMAP Client** enqueues `parse-proposals` jobs
6. **Parse Worker** (Terminal 3) - Picks up job, parses proposal with AI, scores it, stores in DB
7. **User fetches results** via API

## Logging Benefits

- **Terminal 1:** API requests/responses, database operations
- **Terminal 2:** Email sending status, SMTP details, vendor contact info
- **Terminal 3:** AI parsing progress, scoring results, database updates
- **Terminal 4:** Email scanning, vendor reply detection, job enqueuing

## Troubleshooting

If a worker crashes:
1. Check the error message in that terminal
2. Fix the issue
3. Restart just that worker in the same terminal
4. Other workers and API continue running

## Environment Variables Required

Ensure `.env` contains:
- `OPENAI_API_KEY` - for AI parsing/scoring
- `REDIS_URL` - for BullMQ (default: redis://localhost:6379)
- `DATABASE_URL` - PostgreSQL connection
- `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS` - Email inbox access
- `SMTP_*` - Email sending credentials
- `PORT` - API server port (default: 3000)
