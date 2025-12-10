# Backend Workflow: RFP Email Distribution & Proposal Processing

This document describes the complete backend workflow from creating an RFP email through sending it to vendors, receiving proposals, parsing them, and scoring them using AI.

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RFP MANAGEMENT SYSTEM                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              FRONTEND (React)
                                   ↓
                          HTTP POST /v1/rfp/send/:id
                                   ↓
        ┌──────────────────────────────────────────────────────────────┐
        │                    API SERVER (Port 8000)                     │
        │                   - Express.js Framework                      │
        │              - Database Connection Pool                       │
        │              - CORS Enabled for localhost:5173               │
        └──────────────────────────────────────────────────────────────┘
                    ↓                                    ↓
            Database Update               Enqueue Jobs to Redis
         (rfp_vendors table)                      ↓
                                    ┌──────────────────────────┐
                                    │   Redis Message Queue    │
                                    │  (BullMQ v5.65.1)        │
                                    └──────────────────────────┘
                              ↓                            ↓
                    ┌──────────────────┐      ┌──────────────────┐
                    │   EMAIL WORKER   │      │  PARSE WORKER    │
                    │ (Node Process 1) │      │ (Node Process 2) │
                    └──────────────────┘      └──────────────────┘
                             ↓                         ↓
                    ┌──────────────────┐      ┌──────────────────┐
                    │   SMTP Server    │      │   OpenAI API     │
                    │  (gmail.com)     │      │ - Parse Email    │
                    └──────────────────┘      │ - Score Proposal │
                             ↓                └──────────────────┘
                    ┌──────────────────┐             ↓
                    │  Vendor Inboxes  │      ┌──────────────────┐
                    │ (Email Providers)│      │  Database Update │
                    └──────────────────┘      │ (proposals table) │
                             ↓                └──────────────────┘
                    ┌──────────────────┐             ↑
                    │   IMAP CLIENT    │             │
                    │ (Node Process 3) │      (Score Stored)
                    └──────────────────┘
                             ↓
                    ┌──────────────────┐
                    │ Monitors Inbox   │
                    │                  |
                    └──────────────────┘
                             ↓
                    ┌──────────────────┐
                    │ Detects Replies  │
                    │ (Unread Emails)  │
                    └──────────────────┘
                             ↓
              Enqueue "parse-proposals" Job
```

## 🔄 Complete Workflow Steps

### Phase 1: RFP Creation & Email Sending

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: EMAIL DISTRIBUTION                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: User Creates RFP
├─ Frontend: User fills RFP form (title, description, requirements)
├─ POST /v1/rfp
├─ Backend: Stores RFP in database (rfp table)
└─ Response: RFP created with unique ID

STEP 2: User Selects Vendors & Sends RFP
├─ Frontend: User clicks "Send to X vendors" button
├─ Selected Vendors: [vendor_1, vendor_2, vendor_3, ...]
├─ POST /v1/rfp/send/:rfpId with { vendors: [...] }
└─ Payload Example:
   {
     "vendors": ["uuid-1", "uuid-2", "uuid-3"]
   }

STEP 3: Backend Creates Send Jobs
├─ Controller: rfpAPI.send() handler
├─ For each vendor:
│  ├─ Create rfp_vendors record (status: "pending")
│  ├─ Generate unique Message-ID header
│  ├─ Create "send-rfp-emails" queue job
│  └─ Include: RFP ID, Vendor ID, Vendor Email, Message-ID
├─ Database: Insert into rfp_vendors table
│  └─ Columns: id, rfp_id, vendor_id, status, message_id, 
│             sent_at, created_at
└─ Queue: Jobs enqueued to Redis "send-rfp-emails"

STEP 4: Email Worker Processes Queue
├─ Worker: Listens to "send-rfp-emails" queue
├─ Picks up job from queue (BullMQ handles concurrency)
├─ For each job:
│  ├─ Fetch RFP details from database
│  ├─ Fetch Vendor details from database
│  ├─ Generate email content:
│  │  ├─ To: vendor.contact_email
│  │  ├─ Subject: "RFP: {rfp.title}"
│  │  ├─ Body: RFP description + requirements
│  │  ├─ Headers:
│  │  │  ├─ Message-ID: <unique@system.local>
│  │  │  ├─ References: [original-message-id]
│  │  │  └─ In-Reply-To: [original-message-id]
│  │  └─ From: SMTP_USER from .env
│  │
│  ├─ Send via Nodemailer
│  │  ├─ Connection: SMTP_HOST:SMTP_PORT
│  │  ├─ Auth: SMTP_USER:SMTP_PASSWORD
│  │  └─ TLS: Enabled for secure connection
│  │
│  ├─ Update database on success
│  │  ├─ UPDATE rfp_vendors SET status = 'sent'
│  │  ├─ SET sent_at = NOW()
│  │  └─ WHERE id = rfp_vendor_id
│  │
│  └─ Handle errors:
│     ├─ Log error to console
│     ├─ Retry job (BullMQ retry mechanism)
│     └─ Mark as failed if max retries exceeded
│
└─ Job Complete: Email sent successfully

RESULT: All vendors receive RFP email with:
        - Complete RFP details
        - Reply-to email address (configured SMTP_USER)
        - Message-ID header for tracking
```

### Phase 2: Proposal Reception & Detection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: PROPOSAL RECEPTION                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 5: Vendor Receives & Replies
├─ Vendor: Opens RFP email in their email client
├─ Vendor: Prepares proposal document (PDF, Word, Text, etc.)
├─ Vendor: Replies to email with proposal attached/included
└─ IMAP Server: Email received in SMTP_USER inbox

STEP 6: IMAP Client Monitors Inbox
├─ Process: Runs continuously (configured in run-imap.js)
├─ Interval: Checks inbox every 60 seconds (IMAP_SEARCH_INTERVAL_SECONDS)
├─ Connection:
│  ├─ Host: IMAP_HOST (imap.gmail.com)
│  ├─ Port: IMAP_PORT (993 - SSL)
│  ├─ User: IMAP_USER
│  └─ Password: IMAP_PASSWORD
│
├─ Search Logic (every cycle):
│  ├─ Query: "UNSEEN" (unread emails only)
│  ├─ Fetch emails from inbox
│  ├─ Parse email headers
│  ├─ Extract:
│  │  ├─ From: vendor email address
│  │  ├─ Subject: proposal subject
│  │  ├─ In-Reply-To: matches original Message-ID
│  │  ├─ Message-ID: this reply's ID
│  │  ├─ Date: received date
│  │  └─ Body: proposal text/attachments
│  │
│  └─ Match to RFP:
│     ├─ Find original Message-ID in rfp_vendors table
│     ├─ Extract rfp_id from matching record
│     ├─ Extract vendor_id from matching record
│     └─ Validate vendor email matches

STEP 7: Enqueue Parsing Job
├─ For matched reply:
│  ├─ Create "parse-proposals" queue job
│  ├─ Include all email data:
│  │  ├─ Email body/content
│  │  ├─ Attachments (if any)
│  │  ├─ RFP ID
│  │  ├─ Vendor ID
│  │  ├─ Email metadata
│  │  └─ Received timestamp
│  │
│  ├─ Create proposal record (initial):
│  │  ├─ INSERT INTO proposals
│  │  ├─ rfp_id, vendor_id, email_content
│  │  ├─ status: "received"
│  │  ├─ received_at: NOW()
│  │  └─ parsed_data: NULL (will update after parsing)
│  │
│  └─ Mark email as read on IMAP server
│
└─ Queue: Job enqueued to Redis "parse-proposals"

RESULT: Proposal stored in database with status "received"
```

### Phase 3: Proposal Parsing & Scoring

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: AI-POWERED PARSING & SCORING                                       │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 8: Parse Worker Processes Job
├─ Worker: Listens to "parse-proposals" queue
├─ Picks up job from queue
├─ Load email content & proposal details
└─ Ready for parsing

STEP 9: Parse Proposal with OpenAI
├─ API Call: POST https://api.openai.com/v1/chat/completions
├─ Model: gpt-3.5-turbo or gpt-4
├─ Prompt Template:
│  └─ "Parse the following proposal email and extract key information:
│      1. Executive summary
│      2. Proposed solution
│      3. Timeline
│      4. Cost breakdown
│      5. Key features/benefits
│      6. Implementation approach
│      7. Support/maintenance plan
│      
│      Proposal Content:
│      [PROPOSAL TEXT]
│      
│      Return as JSON with extracted fields."
│
├─ Response: Structured JSON with parsed data
│  └─ Example:
│     {
│       "executive_summary": "...",
│       "proposed_solution": "...",
│       "timeline": "...",
│       "cost_breakdown": "...",
│       "key_features": [...],
│       "implementation": "...",
│       "support": "..."
│     }
│
└─ Store: parsed_data in proposals table

STEP 10: Score Proposal
├─ API Call: POST https://api.openai.com/v1/chat/completions (2nd call)
├─ Model: gpt-3.5-turbo or gpt-4
├─ Prompt Template:
│  └─ "Based on the following proposal, score it on a scale of 1-10
│      for each criterion. Return as JSON.
│      
│      RFP Requirements: [RFP REQUIREMENTS]
│      
│      Proposal: [PARSED PROPOSAL DATA]
│      
│      Score the proposal on:
│      1. Completeness (meets all requirements)
│      2. Cost effectiveness
│      3. Timeline feasibility
│      4. Technical approach quality
│      5. Vendor experience/credibility
│      6. Risk mitigation
│      7. Overall alignment
│      
│      Return JSON: {
│        'completeness': <0-10>,
│        'cost_effectiveness': <0-10>,
│        'timeline_feasibility': <0-10>,
│        'technical_approach': <0-10>,
│        'vendor_credibility': <0-10>,
│        'risk_mitigation': <0-10>,
│        'overall_alignment': <0-10>
│      }"
│
├─ Response: JSON with 7 scoring metrics
│  └─ Each score: 0-10 (integer)
│
├─ Calculate: Overall score
│  └─ Formula: Average of 7 metrics = Total Score (0-10)
│
└─ Store: All scores in proposal record

STEP 11: Update Database
├─ UPDATE proposals table:
│  ├─ parsed_data: Parsed email content (JSON)
│  ├─ score_completeness: <0-10>
│  ├─ score_cost_effectiveness: <0-10>
│  ├─ score_timeline_feasibility: <0-10>
│  ├─ score_technical_approach: <0-10>
│  ├─ score_vendor_credibility: <0-10>
│  ├─ score_risk_mitigation: <0-10>
│  ├─ score_overall_alignment: <0-10>
│  ├─ overall_score: <0-10> (average)
│  ├─ status: "parsed"
│  └─ parsed_at: NOW()
│
└─ Job Complete: Proposal fully processed

RESULT: Proposal stored with:
        - Parsed content
        - 7 scoring metrics
        - Overall score
        - Ready for comparison
```

### Phase 4: Proposal Comparison & Display

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: COMPARISON & FRONTEND DISPLAY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 12: Frontend Requests Proposals
├─ Frontend: Navigates to RFP detail page
├─ GET /v1/proposal/rfp/:rfpId
├─ Backend: Queries proposals table
│  └─ WHERE rfp_id = :rfpId AND status = "parsed"
│
└─ Response: Array of proposals with scores

STEP 13: Display Proposals
├─ Frontend: Renders Proposals tab
├─ For each proposal:
│  ├─ Vendor name
│  ├─ Received date
│  ├─ Overall score (color-coded)
│  │  ├─ 8-10: Green (Excellent)
│  │  ├─ 6-7: Yellow (Good)
│  │  ├─ 4-5: Orange (Fair)
│  │  └─ 0-3: Red (Poor)
│  │
│  ├─ Score breakdown (7 metrics)
│  ├─ Parsed content summary
│  └─ Details link to full proposal

STEP 14: Compare Proposals (Optional)
├─ Frontend: Select multiple proposals
├─ POST /v1/comparison/compare
│  └─ Payload: { rfpId, proposalIds: [...] }
│
├─ Backend: 
│  ├─ Fetch all selected proposals
│  ├─ Create comparison matrix
│  ├─ Calculate recommendations
│  └─ Store comparison record
│
└─ Display: Side-by-side comparison view

RESULT: User can:
        - View all received proposals
        - See AI-generated scores
        - Compare vendors
        - Make informed decisions
```

## 🗄️ Database Schema

### rfp_vendors Table
```sql
CREATE TABLE rfp_vendors (
  id UUID PRIMARY KEY,
  rfp_id UUID REFERENCES rfp(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, bounced, failed
  message_id VARCHAR(255) UNIQUE,       -- For tracking email replies
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### proposals Table
```sql
CREATE TABLE proposals (
  id UUID PRIMARY KEY,
  rfp_id UUID REFERENCES rfp(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  email_content TEXT,                    -- Original email body
  parsed_data JSONB,                     -- Parsed proposal structure
  
  -- Score metrics (0-10 scale)
  score_completeness DECIMAL(3,1),
  score_cost_effectiveness DECIMAL(3,1),
  score_timeline_feasibility DECIMAL(3,1),
  score_technical_approach DECIMAL(3,1),
  score_vendor_credibility DECIMAL(3,1),
  score_risk_mitigation DECIMAL(3,1),
  score_overall_alignment DECIMAL(3,1),
  
  overall_score DECIMAL(3,1),            -- Average of 7 scores
  status VARCHAR(20) DEFAULT 'received', -- received, parsed, reviewed
  received_at TIMESTAMP,
  parsed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔑 Key Components

### Email Worker (`src/workers/sendEmail.worker.js`)
- **Purpose**: Process "send-rfp-emails" queue jobs
- **Queue**: BullMQ with Redis backend
- **Concurrency**: Default 1 (configurable)
- **Retry**: 3 attempts with exponential backoff
- **Features**:
  - Database connection pooling
  - SMTP connection handling
  - Message-ID generation for tracking
  - Error logging and retry logic

### Parse Worker (`src/workers/parseProposal.worker.js`)
- **Purpose**: Process "parse-proposals" queue jobs
- **Queue**: BullMQ with Redis backend
- **Concurrency**: Default 1 (configurable)
- **Retry**: 3 attempts with exponential backoff
- **Features**:
  - OpenAI API integration
  - Two-stage processing (parse, then score)
  - JSON validation
  - Database updates

### IMAP Client (`src/integrations/imapClient.js`)
- **Purpose**: Monitor inbox for proposal replies
- **Interval**: 60 seconds (configurable)
- **Features**:
  - IMAP connection with TLS
  - Unread email detection
  - Email parsing and extraction
  - Message-ID matching
  - Queue job creation
  - Error handling and reconnection

## 📊 Data Flow Summary

```
User Creates RFP
    ↓
User Selects Vendors & Sends
    ↓
API: POST /v1/rfp/send/:id
    ↓
Create rfp_vendors records + Enqueue send jobs
    ↓
Email Worker processes queue
    ↓
SMTP sends emails to vendors (Message-ID in headers)
    ↓
Vendor replies to email
    ↓
IMAP Client detects reply (every 60s)
    ↓
Match Message-ID to rfp_vendors record
    ↓
Create proposal record + Enqueue parse job
    ↓
Parse Worker processes queue
    ↓
OpenAI parses email content
    ↓
OpenAI scores proposal (7 metrics)
    ↓
Update proposal with parsed data & scores
    ↓
Frontend displays proposals with scores
    ↓
User reviews & compares proposals
```

## ⚙️ Configuration & Environment Variables

Key variables for this workflow:

```env
# SMTP (Email Sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# IMAP (Email Receiving)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password
IMAP_SEARCH_INTERVAL_SECONDS=60

# OpenAI (Parsing & Scoring)
OPENAI_API_KEY=sk-your-key-here

# Redis (Queue Backend)
REDIS_URL=redis://localhost:6379

# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/rfp_system
```

## 🚀 Running the Full Workflow

To run all components:

```bash
# Terminal 1: API Server
cd backend
node src/index.js

# Terminal 2: Email Worker
node run-email-worker.js

# Terminal 3: Parse Worker
node run-parse-worker.js

# Terminal 4: IMAP Client
node run-imap.js

# Terminal 5: Frontend
cd frontend
npm run dev
```

Access at: `http://localhost:5173`

## 🔍 Monitoring & Debugging

### Check Email Queue Status
```javascript
const queue = new Queue('send-rfp-emails', 'redis://localhost:6379');
const counts = await queue.getJobCounts();
console.log(counts); // { active, completed, failed, delayed, waiting }
```

### Check Parse Queue Status
```javascript
const queue = new Queue('parse-proposals', 'redis://localhost:6379');
const counts = await queue.getJobCounts();
console.log(counts);
```

### Monitor Database
```sql
-- Check proposals with scores
SELECT vendor_id, overall_score, status FROM proposals WHERE rfp_id = 'rfp-uuid' ORDER BY overall_score DESC;

-- Check RFP vendor send status
SELECT vendor_id, status, sent_at FROM rfp_vendors WHERE rfp_id = 'rfp-uuid';
```

## 🎯 Workflow Summary

| Phase | Component | Input | Process | Output |
|-------|-----------|-------|---------|--------|
| 1 | API + Email Worker | RFP + Vendors | Generate emails, queue jobs | Emails sent, DB updated |
| 2 | IMAP Client | Inbox | Monitor, detect replies | Proposals stored |
| 3 | Parse Worker | Proposal email | Parse with AI, score with AI | Parsed data + 7 scores |
| 4 | Frontend | Proposals | Display & compare | User insights |

---

**Last Updated**: December 2025
**Version**: 1.0.0
