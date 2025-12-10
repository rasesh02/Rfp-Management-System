# RFP Management System - Frontend

A modern, responsive web application for managing Request for Proposals (RFPs) using React, Vite, and Tailwind CSS.

## Features

✅ **RFP Management** - Create, list, and manage RFPs  
✅ **Vendor Management** - Add and manage vendors with full CRUD  
✅ **Proposal Tracking** - Automatically receive and parse vendor proposals  
✅ **AI-Powered Scoring** - Automatic proposal evaluation and scoring  
✅ **Proposal Comparison** - Compare multiple proposals with AI recommendations  
✅ **Dashboard** - Quick overview of RFPs, vendors, and proposals  
✅ **Responsive Design** - Works seamlessly on desktop and mobile  

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide Icons** - Icons

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── pages/
│   ├── Dashboard.jsx          # Main dashboard
│   ├── RFP/
│   │   ├── RFPList.jsx        # List all RFPs
│   │   ├── RFPCreate.jsx      # Create new RFP
│   │   └── RFPDetail.jsx      # View RFP details
│   ├── Vendor/
│   │   ├── VendorList.jsx     # List vendors
│   │   └── VendorCreate.jsx   # Add new vendor
│   ├── Proposal/
│   │   ├── ProposalList.jsx   # List proposals for RFP
│   │   └── ProposalDetail.jsx # View proposal details
│   └── Comparison/
│       └── Comparison.jsx     # Compare proposals
├── components/
│   ├── Layout.jsx             # Main layout with navigation
│   ├── Button.jsx             # Reusable button component
│   ├── Alert.jsx              # Alert component
│   └── Loading.jsx            # Loading spinner
├── api.js                     # API service layer
├── App.jsx                    # Main app component
├── main.jsx                   # Entry point
└── index.css                  # Global styles
```

## API Integration

The frontend connects to the backend API at `http://localhost:6000`. The API routes are proxied through Vite's dev server.

### Endpoints Used

**RFP APIs:**
- `GET /v1/rfp` - List RFPs
- `POST /v1/rfp` - Create RFP
- `GET /v1/rfp/:id` - Get RFP details
- `PUT /v1/rfp/:id` - Update RFP
- `DELETE /v1/rfp/:id` - Delete RFP
- `POST /v1/rfp/send/:id` - Send RFP to vendors

**Vendor APIs:**
- `GET /v1/vendor` - List vendors
- `POST /v1/vendor` - Create vendor
- `GET /v1/vendor/:id` - Get vendor details
- `PUT /v1/vendor/:id` - Update vendor
- `DELETE /v1/vendor/:id` - Delete vendor
- `GET /v1/vendor/search?q=query` - Search vendors

**Proposal APIs:**
- `GET /v1/proposal/:id` - Get proposal details
- `GET /v1/proposal/rfp/:rfpId` - List proposals for RFP
- `GET /v1/proposal/parsed/:rfpId` - List parsed proposals
- `GET /v1/proposal/:id/status` - Check proposal status
- `POST /v1/proposal/:id/rescore` - Re-score proposal

**Comparison APIs:**
- `POST /v1/comparison/compare` - Compare proposals
- `POST /v1/comparison/evaluate` - Get AI evaluation
- `GET /v1/comparison/:id` - Get comparison details
- `GET /v1/comparison/rfp/:rfpId` - List comparisons for RFP

## Features in Detail

### Dashboard
- Overview of all RFPs, vendors, and proposals
- Quick stats and recent RFPs
- Quick action cards for common tasks

### RFP Management
- Create new RFPs with AI-powered structuring
- Send RFPs to multiple vendors via email
- Track RFP status and proposals received
- View associated proposals for each RFP

### Vendor Management
- Add and manage vendor information
- Search vendors by name or email
- Track vendor communication

### Proposal Management
- Automatically receive vendor responses
- AI-powered proposal parsing and summarization
- AI-powered scoring (0-100) with 7 evaluation metrics
- View parsed proposal details
- Download attachments
- Rescore proposals manually

### Proposal Comparison
- Compare multiple proposals side-by-side
- AI-powered recommendation engine
- Detailed scoring matrix
- Strengths and concerns analysis

## UI Components

### Button Component
Multiple variants and sizes:
- Variants: `primary` (default), `secondary`, `success`, `danger`, `outline`
- Sizes: `sm`, `md` (default), `lg`
- Supports loading state

### Alert Component
- Types: `info`, `success`, `warning`, `error`
- Dismissible alerts

### Layout
- Responsive navigation bar
- Mobile-friendly hamburger menu
- Footer

## Styling

Tailwind CSS is used for styling with custom configuration:
- Custom color palette for primary/secondary colors
- Responsive grid and flex layouts
- Utility-first approach for rapid development

## Development Tips

- Hot Module Replacement (HMR) is enabled for fast development
- Axios is configured with base URL for API calls
- React Router handles navigation without page reloads
- Lucide Icons provide beautiful, consistent icons

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- User authentication and authorization
- Email notifications
- Proposal timeline/history
- Advanced filtering and sorting
- Export proposals to PDF
- Bulk operations
- Real-time proposal updates via WebSockets

## Support

For issues or feature requests, please contact the development team.
