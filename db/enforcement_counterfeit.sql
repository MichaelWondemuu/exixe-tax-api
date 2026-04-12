-- Reference DDL for PostgreSQL (tables are also created via Sequelize sync if enabled).
-- Counterfeit reports: authenticated submissions; cases: manual enforcement workflow.
--
-- Existing DB without reported_by_user_id:
-- ALTER TABLE counterfeit_reports ADD COLUMN IF NOT EXISTS reported_by_user_id UUID REFERENCES users (id);

CREATE TABLE IF NOT EXISTS counterfeit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_organization_id UUID REFERENCES organizations (id),
  reported_by_user_id UUID REFERENCES users (id),
  description TEXT NOT NULL,
  reporter_name VARCHAR(255),
  reporter_email VARCHAR(255),
  reporter_phone VARCHAR(64),
  facility_id UUID REFERENCES excise_facilities (id),
  product_id UUID REFERENCES products (id),
  stamp_identifier VARCHAR(256),
  evidence JSONB,
  status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counterfeit_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  subject_organization_id UUID REFERENCES organizations (id),
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  created_by_user_id UUID NOT NULL REFERENCES users (id),
  assigned_to_user_id UUID REFERENCES users (id),
  source_counterfeit_report_id UUID REFERENCES counterfeit_reports (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counterfeit_case_stamp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counterfeit_case_id UUID NOT NULL REFERENCES counterfeit_cases (id) ON DELETE CASCADE,
  excise_stamp_verification_id UUID NOT NULL REFERENCES excise_stamp_verifications (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (counterfeit_case_id, excise_stamp_verification_id)
);

CREATE INDEX IF NOT EXISTS idx_counterfeit_reports_created_at ON counterfeit_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_counterfeit_cases_created_by ON counterfeit_cases (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_counterfeit_cases_created_at ON counterfeit_cases (created_at DESC);

-- Suspicious product reports (separate resource; product_id required)
CREATE TABLE IF NOT EXISTS suspicious_product_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (id),
  subject_organization_id UUID REFERENCES organizations (id),
  reported_by_user_id UUID REFERENCES users (id),
  description TEXT NOT NULL,
  reporter_name VARCHAR(255),
  reporter_email VARCHAR(255),
  reporter_phone VARCHAR(64),
  facility_id UUID REFERENCES excise_facilities (id),
  stamp_identifier VARCHAR(256),
  evidence JSONB,
  status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suspicious_product_reports_created_at ON suspicious_product_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_product_reports_product_id ON suspicious_product_reports (product_id);

-- Product recalls (regulator / manufacturing–quality workflow; not tied to counterfeit cases)
-- If you created product_recalls with source_counterfeit_case_id, drop it:
-- ALTER TABLE product_recalls DROP COLUMN IF EXISTS source_counterfeit_case_id;
CREATE TABLE IF NOT EXISTS product_recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  product_id UUID NOT NULL REFERENCES products (id),
  product_variant_id UUID REFERENCES product_variants (id),
  lot_or_batch_code VARCHAR(128),
  subject_organization_id UUID REFERENCES organizations (id),
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  initiated_by_user_id UUID NOT NULL REFERENCES users (id),
  published_at TIMESTAMPTZ,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_recalls_product_status ON product_recalls (product_id, status);
CREATE INDEX IF NOT EXISTS idx_product_recalls_status_published ON product_recalls (status, published_at);
