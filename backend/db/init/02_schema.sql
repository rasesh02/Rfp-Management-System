-- Core tables: rfps, vendors, rfp_vendors, proposals, attachments, comparison_runs

CREATE TABLE IF NOT EXISTS rfps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  nl_description TEXT,  -- optional natural language description
  structured JSONB,
  status VARCHAR(32) DEFAULT 'draft',
  created_by TEXT,             -- optional single-user field
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfp_vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfp_id UUID NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ,
  email_message_id TEXT,
  status VARCHAR(32) DEFAULT 'not_sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfp_id UUID NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  raw_email TEXT,               -- full raw text/html of the email
  raw_attachments JSONB,        -- array of { filename, s3_url, content_type }
  parsed JSONB,                 -- parsed structured proposal extracted by AI
  score DOUBLE PRECISION,       -- aggregated numeric score
  recommendation_reason TEXT,   -- short LLM explanation for recommendation
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  filename TEXT,
  content_type TEXT,
  s3_url TEXT,
  ocr_text TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comparison_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfp_id UUID NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  config JSONB,     -- weights, rules, business objectives
  results JSONB     -- final scores, ranking, explanation
);

-- Useful indexes
-- CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);
-- CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors USING gin (to_tsvector('english', coalesce(name, '')));
-- CREATE INDEX IF NOT EXISTS idx_proposals_rfp_id ON proposals(rfp_id);
-- CREATE INDEX IF NOT EXISTS idx_proposals_vendor_id ON proposals(vendor_id);
