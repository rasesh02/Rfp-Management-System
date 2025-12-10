# RFP System API Documentation

## Base URL
```
http://localhost:3000/v1
```

---

## 1. RFP Endpoints (`/v1/rfp`)

### Get All RFPs
```
GET /rfp
Query params: limit=100, offset=0, status=draft|active|closed
```
**Response:**
```json
{
  "success": true,
  "data": [...RFP objects],
  "count": 10
}
```

### Create RFP
```
POST /rfp
```
**Request Body:**
```json
{
  "nl_description": "We need a cloud infrastructure for 1000 users"
}
```
OR
```json
{
  "title": "Cloud Infrastructure RFP",
  "description": "Detailed description",
  "structured": {...JSON structure}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "structured": {...}
  }
}
```

### Get RFP by ID
```
GET /rfp/:id
```

### Update RFP
```
PUT /rfp/:id
```
**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "active",
  "structured": {...}
}
```

### Delete RFP
```
DELETE /rfp/:id
```

### Send RFP to Vendors
```
POST /rfp/:id/send
```
**Request Body:**
```json
{
  "vendorIds": ["vendor-uuid-1", "vendor-uuid-2"],
  "message": "Please review our RFP",
  "emailTemplateId": "optional-template-id"
}
```

---

## 2. Vendor Endpoints (`/v1/vendor`)

### Get All Vendors
```
GET /vendor
```
**Response:**
```json
{
  "success": true,
  "data": [...vendor objects],
  "count": 50
}
```

### Create Vendor
```
POST /vendor
```
**Request Body:**
```json
{
  "name": "Acme Corp",
  "contact_email": "contact@acme.com",
  "contact_person": "John Doe",
  "contact_phone": "+1234567890",
  "metadata": {
    "industry": "Cloud Services",
    "years_in_operation": 10
  }
}
```

### Get Vendor by ID
```
GET /vendor/:id
```

### Update Vendor
```
PUT /vendor/:id
```
**Request Body:**
```json
{
  "name": "Updated Name",
  "contact_email": "newemail@company.com"
}
```

### Delete Vendor
```
DELETE /vendor/:id
```

### Search Vendors
```
GET /vendor/search?q=searchterm
```
**Response:**
```json
{
  "success": true,
  "data": [...matching vendors],
  "count": 5
}
```

---

## 3. Proposal Endpoints (`/v1/proposal`)

### Get Proposal by ID
```
GET /proposal/:id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "rfp_id": "uuid",
    "vendor_name": "Vendor Name",
    "parsed": {...parsed proposal JSON},
    "score": 85.5,
    "recommendation": "Highly recommended",
    "received_at": "2025-12-10T..."
  }
}
```

### Get All Proposals for RFP
```
GET /proposal/rfp/:rfpId/all
Query params: limit=100, offset=0
```

### Get Parsed Proposals for RFP
```
GET /proposal/rfp/:rfpId/parsed
```
Returns only proposals with parsed JSON data, sorted by score DESC

### Get Proposal Status for RFP
```
GET /proposal/rfp/:rfpId/status
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "received": 5,
    "parsed": 3,
    "scored": 3,
    "pending_parse": 2,
    "proposals": [
      {
        "id": "uuid",
        "vendor_name": "Vendor Name",
        "received_at": "...",
        "parsed": true,
        "score": 85.5,
        "recommendation": "..."
      }
    ]
  }
}
```

### Rescore Proposal
```
POST /proposal/:proposalId/rescore
```
Triggers AI to re-evaluate the proposal and update scores

---

## 4. Comparison & Evaluation Endpoints (`/v1/comparison`)

### Compare Proposals
```
POST /comparison/:rfpId/compare
```
**Request Body (Optional):**
```json
{
  "proposal_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```
If not provided, compares all parsed proposals for the RFP

**Response:**
```json
{
  "success": true,
  "data": {
    "rfp_id": "uuid",
    "rfp_title": "...",
    "proposals_count": 3,
    "comparison_at": "...",
    "proposals": [...],
    "ranked": [
      {
        "rank": 1,
        "vendor_name": "Winner Vendor",
        "vendor_email": "...",
        "score": 95,
        "recommendation": "Highly recommended"
      }
    ]
  }
}
```

### Get AI-Assisted Evaluation
```
GET /comparison/:rfpId/evaluation
```
**Response:**
```json
{
  "success": true,
  "data": {
    "rfp_id": "uuid",
    "rfp_title": "...",
    "evaluation_date": "...",
    "total_proposals": 5,
    "summary": {
      "best_overall": {...proposal},
      "best_cost": {...proposal},
      "best_timeline": {...proposal}
    },
    "all_proposals": [
      {
        "id": "uuid",
        "vendor_name": "...",
        "score": 85,
        "cost": 50000,
        "timeline": "6 months",
        "quality": {...},
        "compliance": {...}
      }
    ]
  }
}
```

### Save Comparison Results
```
POST /comparison/:rfpId/comparison/save
```
**Request Body:**
```json
{
  "results": {...comparison results},
  "config": {
    "weights": {
      "cost": 0.25,
      "timeline": 0.15,
      "quality": 0.30
    }
  }
}
```

### Get All Comparisons for RFP
```
GET /comparison/:rfpId/comparisons
```

### Get Specific Comparison
```
GET /comparison/comparisons/:comparisonId
```

---

## Workflow Example

### 1. Create an RFP
```bash
curl -X POST http://localhost:3000/v1/rfp \
  -H "Content-Type: application/json" \
  -d '{
    "nl_description": "Need a cloud platform for SaaS",
    "meta": {"budget": "100000"}
  }'
```

### 2. Create Vendors
```bash
curl -X POST http://localhost:3000/v1/vendor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AWS Partner",
    "contact_email": "sales@awspartner.com",
    "contact_person": "Alice Smith"
  }'
```

### 3. Send RFP to Vendors
```bash
curl -X POST http://localhost:3000/v1/rfp/{rfpId}/send \
  -H "Content-Type: application/json" \
  -d '{
    "vendorIds": ["vendor-id-1", "vendor-id-2"],
    "message": "Please submit your proposal"
  }'
```

### 4. Wait for Vendor Replies
- IMAP client automatically detects vendor emails
- Proposals are parsed and scored

### 5. Check Proposal Status
```bash
curl http://localhost:3000/v1/proposal/rfp/{rfpId}/status
```

### 6. Get Evaluation
```bash
curl http://localhost:3000/v1/comparison/{rfpId}/evaluation
```

### 7. Compare & Decide
```bash
curl -X POST http://localhost:3000/v1/comparison/{rfpId}/compare
```

---

## Error Responses

All endpoints follow this error format:

```json
{
  "success": false,
  "message": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

---

## Notes

- All IDs are UUIDs
- Timestamps are ISO 8601 format
- Proposal parsing and scoring happens asynchronously via BullMQ workers
- IMAP client runs continuously and auto-detects vendor replies
