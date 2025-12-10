# 🚀 Quick Start Guide - RFP System (Frontend + Backend)

## Prerequisites
- Node.js 16+ installed
- Backend API running on `http://localhost:6000`
- PostgreSQL running
- Redis running
- Gmail SMTP & IMAP configured

## Complete Setup (5 Terminals)

### Terminal 1: Backend API Server
```bash
cd backend
node src/index.js
```
✅ Runs on `http://localhost:6000`
- Serves REST API
- Connects to PostgreSQL
- Starts Express server

### Terminal 2: Email Worker
```bash
cd backend
node run-email-worker.js
```
✅ Processes `send-rfp-emails` queue
- Sends RFP emails to vendors
- Updates database with tracking info

### Terminal 3: Proposal Parser Worker
```bash
cd backend
node run-parse-worker.js
```
✅ Processes `parse-proposals` queue
- Parses vendor emails with AI
- Scores proposals (0-100)
- Stores results in database

### Terminal 4: IMAP Email Client
```bash
cd backend
node run-imap.js
```
✅ Monitors vendor inbox
- Detects vendor replies
- Saves proposals to database
- Enqueues parsing jobs

### Terminal 5: Frontend Dev Server
```bash
cd frontend
npm install  # First time only
npm run dev
```
✅ Runs on `http://localhost:5173`
- React development server
- Hot module reloading
- API proxy to backend

---

## 📱 Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 🔄 Data Flow

```
1. Create RFP
   └─> Frontend /rfps/create
       └─> POST /v1/rfp
           └─> Backend creates RFP

2. Send RFP to Vendors
   └─> Frontend RFPDetail tab: Vendors
       └─> Select vendors & click "Send"
           └─> POST /v1/rfp/send/:id
               └─> Enqueues email jobs
                   └─> Email Worker processes
                       └─> Sends emails to vendors

3. Receive Vendor Replies
   └─> Vendor replies to email
       └─> IMAP Client detects reply
           └─> Saves proposal to database
               └─> Enqueues parse job
                   └─> Parse Worker processes
                       └─> AI parses & scores
                           └─> Updates database

4. View & Compare Proposals
   └─> Frontend /rfps/:id/proposals
       └─> View all proposals with scores
           └─> Compare proposals
               └─> Get AI recommendation
```

## ✅ Checklist Before Starting

- [ ] Backend `.env` file configured with:
  - POSTGRES_URL
  - REDIS_URL
  - OPENAI_API_KEY
  - SMTP credentials (Gmail)
  - IMAP credentials (Gmail)
  
- [ ] PostgreSQL database running
- [ ] Redis server running
- [ ] Backend node_modules installed
- [ ] Frontend node_modules installed

## 🧪 Testing the System

### 1. Create a Vendor
1. Go to `http://localhost:5173/vendors/create`
2. Fill in vendor details
3. Click "Add Vendor"

### 2. Create an RFP
1. Go to `http://localhost:5173/rfps/create`
2. Enter RFP title and description
3. Click "Create RFP"

### 3. Send RFP to Vendor
1. Click on the RFP to view details
2. Click "Vendors" tab
3. Select the vendor checkbox
4. Click "Send to 1 vendor"
5. Check Terminal 2 (Email Worker) for confirmation

### 4. Send Reply Email
1. Vendor sends reply email to configured Gmail inbox
2. Check Terminal 4 (IMAP Client) for detection
3. Check Terminal 3 (Parse Worker) for processing

### 5. View Proposals
1. Go to `http://localhost:5173/rfps/{rfp-id}/proposals`
2. See parsed proposals with AI scores
3. Click "View Full Proposal" for details

### 6. Compare Proposals
1. Go to `http://localhost:5173/rfps/{rfp-id}/compare`
2. Select 2+ proposals
3. Click "Compare" to get AI recommendation

## 🐛 Troubleshooting

### Backend won't start
- Check if port 6000 is in use: `lsof -i :6000`
- Verify PostgreSQL is running: `psql -U postgres -l`
- Check Redis is running: `redis-cli ping`

### Email Worker not processing
- Check Terminal 2 output for errors
- Verify SMTP credentials in `.env`
- Check Redis connection in Terminal 2 startup

### Parse Worker not processing
- Check Terminal 3 output for errors
- Verify OPENAI_API_KEY in `.env`
- Check database connection

### IMAP Client not detecting emails
- Check Terminal 4 output for errors
- Verify IMAP credentials (Gmail requires App Password)
- Check if emails are in the correct inbox

### Frontend API calls failing
- Check if backend is running on port 6000
- Check browser console for CORS errors
- Verify API endpoints in `src/api.js`

## 📊 Monitoring

### Check Backend Health
```bash
curl http://localhost:6000/health
```

### View Redis Queue Status
```bash
redis-cli
> LLEN send-rfp-emails
> LLEN parse-proposals
```

### View Database
```bash
psql -U postgres -d rfp_system -c "SELECT * FROM rfps LIMIT 5;"
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm install
# Then deploy to server and run: node src/index.js
```

### Frontend
```bash
cd frontend
npm install
npm run build
# Upload `dist/` folder to web server or CDN
```

## 🌐 Environment Variables

### Backend `.env`
```env
POSTGRES_URL=postgresql://user:pass@localhost:5432/rfp_system
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
PORT=6000
```

### Frontend (uses proxy in vite.config.js)
- No `.env` needed for development
- Update `vite.config.js` if backend is on different URL

## 💡 Tips

1. **Gmail Setup for SMTP/IMAP:**
   - Enable 2FA on Google account
   - Generate App Password (not regular password)
   - Use App Password in SMTP_PASS and IMAP_PASS

2. **Local Testing:**
   - Create test vendor with your own email
   - Send RFP to yourself
   - Reply to the email and watch it get parsed

3. **Monitoring Jobs:**
   - Check BullMQ UI (if installed): `http://localhost:3000/admin/queues`
   - Or use Redis CLI: `redis-cli`

4. **Database Backups:**
   ```bash
   pg_dump -U postgres rfp_system > backup.sql
   ```

## 📚 Documentation

- Backend: See `backend/README.md` and `backend/API_DOCUMENTATION.md`
- Frontend: See `frontend/README.md`
- This file: Quick start guide

## 🎉 Success!

Once all 5 terminals show successful startup messages:
- Backend: "API Server running at port 6000"
- Email Worker: "Starting Email Worker..."
- Parse Worker: "Starting Parse Proposal Worker..."
- IMAP Client: "IMAP client started..."
- Frontend: "Local: http://localhost:5173"

You're ready to use the RFP System!

Visit `http://localhost:5173` and start managing RFPs! 🚀
