# RFP Management System

A comprehensive Request for Proposal (RFP) management platform built with modern web technologies. This system enables organizations to create RFPs, distribute them to vendors, receive and parse proposals, and compare vendor responses using AI-powered analysis.

## 🌟 Features

### Core Functionality
- **RFP Management**: Create, edit, and manage RFPs with detailed specifications
- **Vendor Management**: Maintain a database of vendors with contact information
- **Proposal Tracking**: Receive and track proposals from vendors
- **AI-Powered Analysis**: 
  - Automatic proposal parsing using OpenAI
  - Intelligent scoring based on 7 evaluation metrics
  - Vendor comparison and recommendation engine
- **Email Integration**: 
  - Send RFPs directly to vendor email addresses
  - Automatically receive and process proposal replies via IMAP
  - Track email communication history

### Technical Features
- Real-time queue processing with BullMQ
- Asynchronous email handling
- PostgreSQL database with migrations
- RESTful API architecture
- Responsive React frontend with Tailwind CSS
- 5-process architecture for scalability

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5.2.1
- **Database**: PostgreSQL
- **Queue System**: BullMQ v5.65.1 + Redis
- **AI**: OpenAI API v6.10.0
- **Email**: 
  - Nodemailer v7.0.11 (SMTP)
  - ImapFlow v1.1.1 (IMAP)

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router 6.20.0
- **HTTP Client**: Axios 1.6.2
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- Redis (v6+)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/rasesh02/Rfp-Management-System.git
cd Rfp_System
```

### 2. Environment Setup

Create `.env` file in the `backend` directory with the following variables:

```env
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/rfp_system

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=sk-your-key-here

# Email - SMTP (for sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email - IMAP (for receiving)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password

# Server
PORT=8000
NODE_ENV=development
```

### 3. Database Setup

```bash
cd backend
# The database will be initialized automatically on first connection
# Or manually run migrations if needed
npm run migrate
```

### 4. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 5. Start the Application

#### Option A: Single Terminal (Development)
```bash
# Terminal 1: Backend API
cd backend
npm start

# Terminal 2: Frontend Dev Server
cd frontend
npm run dev
```

#### Option B: Separate Terminals (Recommended for Development)
```bash
# Terminal 1: API Server
cd backend
node src/index.js

# Terminal 2: Email Worker
node run-email-worker.js

# Terminal 3: Proposal Parser Worker
node run-parse-worker.js

# Terminal 4: IMAP Client
node run-imap.js

# Terminal 5: Frontend Dev Server
cd frontend
npm run dev
```

## 📚 API Documentation

Base URL: `http://localhost:8000`

### RFP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/rfp` | List all RFPs |
| POST | `/v1/rfp` | Create new RFP |
| GET | `/v1/rfp/:id` | Get RFP details |
| PUT | `/v1/rfp/:id` | Update RFP |
| DELETE | `/v1/rfp/:id` | Delete RFP |
| POST | `/v1/rfp/send/:id` | Send RFP to vendors |

### Vendor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/vendor` | List all vendors |
| POST | `/v1/vendor` | Create vendor |
| GET | `/v1/vendor/:id` | Get vendor details |
| PUT | `/v1/vendor/:id` | Update vendor |
| DELETE | `/v1/vendor/:id` | Delete vendor |
| GET | `/v1/vendor/search?q=query` | Search vendors |

### Proposal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/proposal/:id` | Get proposal details |
| GET | `/v1/proposal/rfp/:rfpId` | Get proposals for RFP |
| GET | `/v1/proposal/parsed/:rfpId` | Get parsed proposals |
| GET | `/v1/proposal/:id/status` | Get proposal status |
| POST | `/v1/proposal/:id/rescore` | Rescore proposal |

### Comparison Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/comparison/compare` | Compare proposals |
| POST | `/v1/comparison/evaluate` | Evaluate all proposals for RFP |
| GET | `/v1/comparison/:id` | Get comparison results |
| GET | `/v1/comparison/rfp/:rfpId` | Get RFP comparison |

## 📖 Usage Guide

### Creating and Sending an RFP

1. **Create RFP**
   - Navigate to RFPs page
   - Click "Create New RFP"
   - Fill in title, description, and requirements
   - Submit to create

2. **Add Vendors** (if not already added)
   - Go to Vendors page
   - Click "Add Vendor"
   - Enter vendor details (name, email, contact person, phone)
   - Submit

3. **Send RFP to Vendors**
   - Open the RFP you created
   - Go to "Vendors" tab
   - Select vendors you want to send to
   - Click "Send RFP to X vendors"
   - Emails will be sent automatically

### Receiving Proposals

- Vendors reply to the RFP email
- The IMAP client monitors the inbox every 60 seconds
- Proposals are automatically parsed and scored using AI
- Results appear in the RFP "Proposals" tab

### Comparing Proposals

1. Once proposals are received, go to RFP detail page
2. Click "Proposals" tab to view all proposals
3. Each proposal shows:
   - Vendor name
   - Received date
   - AI-generated score
   - Detailed parsed content

## 🏗️ Project Structure

```
Rfp_System/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app configuration
│   │   ├── index.js            # API server entry point
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Route handlers
│   │   ├── models/             # Data models
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── workers/            # Queue workers
│   │   └── integrations/       # External integrations
│   ├── db/                     # Database initialization
│   ├── run-*.js                # Standalone runner scripts
│   ├── package.json
│   └── .env                    # Environment variables (not tracked)
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # React pages
│   │   ├── components/         # Reusable components
│   │   ├── api.js              # API service layer
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   └── index.html              # HTML template
│
├── README.md
├── QUICK_START.md              # Quick start guide
└── SEPARATE_TERMINALS_GUIDE.md # Multi-terminal setup guide
```

## 🔄 5-Process Architecture

The system uses separate processes for better scalability and logging:

1. **API Server** (`src/index.js`)
   - REST API endpoints
   - Database connection management
   - Request handling

2. **Email Worker** (`run-email-worker.js`)
   - Processes "send-rfp-emails" queue
   - Sends RFPs via SMTP
   - Updates database with send status

3. **Parse Worker** (`run-parse-worker.js`)
   - Processes "parse-proposals" queue
   - Parses proposal emails with AI
   - Scores proposals with 7 metrics

4. **IMAP Client** (`run-imap.js`)
   - Monitors vendor email inbox
   - Detects proposal replies
   - Enqueues parsing jobs

5. **Frontend Dev Server**
   - React development server on port 5173
   - Hot module reloading
   - Proxies API requests to backend

## 🔐 Security Notes

- **Never commit `.env` file** - It contains sensitive API keys
- Use strong passwords for database and email accounts
- Keep API keys secure and rotate regularly
- Use OAuth2 for email services when possible
- CORS is configured for localhost development only

## 🚨 Troubleshooting

### Backend won't start
- Check if Redis is running: `redis-cli ping`
- Check if PostgreSQL is running: `psql -U postgres`
- Verify `.env` file has correct database URL
- Check for port 8000 availability: `lsof -i :8000`

### Vendors not appearing in RFP
- Ensure vendors were created successfully
- Check backend logs for any errors
- Verify database connection with: `SELECT COUNT(*) FROM vendors;`
- Try refreshing vendors with the refresh button

### Emails not sending
- Verify SMTP credentials in `.env`
- Check firewall/proxy settings
- Ensure app password is used (not main password) for Gmail
- Check backend logs for SMTP errors

### Proposals not being received
- Ensure IMAP credentials are correct
- Check if inbox has unread emails
- Verify IMAP client is running
- Check backend logs for IMAP errors
- Ensure "Search in server" is enabled for email provider

### Database connection errors
- Ensure PostgreSQL service is running
- Verify `POSTGRES_URL` in `.env` is correct
- Check database exists: `psql -l`
- Try creating database manually if needed

## 📝 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `POSTGRES_URL` | Database connection | `postgresql://user:pass@localhost:5432/rfp_system` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `SMTP_HOST` | Email sending server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password | `app-password` |
| `IMAP_HOST` | Email receiving server | `imap.gmail.com` |
| `IMAP_PORT` | IMAP port | `993` |
| `IMAP_USER` | IMAP username | `email@gmail.com` |
| `IMAP_PASSWORD` | IMAP password | `app-password` |
| `PORT` | Backend API port | `8000` |
| `NODE_ENV` | Environment | `development` or `production` |

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👨‍💻 Author

Rasesh Rana - [GitHub Profile](https://github.com/rasesh02)

## 📞 Support

For issues, questions, or suggestions, please create an issue on GitHub or contact the maintainer.

---

**Last Updated**: December 2025
**Version**: 1.0.0
