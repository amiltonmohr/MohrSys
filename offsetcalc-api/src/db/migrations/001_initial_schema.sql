-- OffsetCalc SaaS Initial Schema
-- Run: psql $DATABASE_URL -f this_file.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Tenants ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  feature_flags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC);

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  last_login TIMESTAMPTZ,
  disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Configs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  materials JSONB NOT NULL DEFAULT '[]',
  machines JSONB NOT NULL DEFAULT '[]',
  finishing JSONB NOT NULL DEFAULT '[]',
  chapa_cost_brl DECIMAL(10,2) NOT NULL DEFAULT 18.00,
  ink_cost_cmyk_per_ml DECIMAL(8,4) NOT NULL DEFAULT 0.048,
  ink_cost_pantone_per_ml DECIMAL(8,4) NOT NULL DEFAULT 0.090,
  labor_cost_per_hour_brl DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  setup_cost_per_chapa_brl DECIMAL(10,2) NOT NULL DEFAULT 12.00,
  overhead_pct DECIMAL(5,2) NOT NULL DEFAULT 35.00,
  margin_pct DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, version)
);
CREATE INDEX IF NOT EXISTS idx_configs_tenant_id ON configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_configs_tenant_status ON configs(tenant_id, status);

-- ── Config changelog ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS config_changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  config_id UUID REFERENCES configs(id) ON DELETE SET NULL,
  from_version INT,
  to_version INT,
  changes JSONB NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_config_changelog_tenant_id ON config_changelog(tenant_id);

-- ── Clients ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Brasil',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_name_fts ON clients USING gin(to_tsvector('portuguese', name));

-- ── Quotes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  reference_number VARCHAR(50),
  description TEXT,
  product_type VARCHAR(50) NOT NULL,
  paper_type VARCHAR(100),
  paper_gramatura VARCHAR(10),
  width_mm DECIMAL(8,2),
  height_mm DECIMAL(8,2),
  quantity INT NOT NULL,
  colors_front INT DEFAULT 4,
  colors_back INT DEFAULT 0,
  finishing_specs JSONB DEFAULT '{}',
  num_sheets INT,
  num_plates INT,
  ink_per_color_ml DECIMAL(8,2),
  total_labor_hours DECIMAL(10,2),
  subtotal_brl DECIMAL(12,2) NOT NULL,
  breakdown_items JSONB NOT NULL DEFAULT '[]',
  total_brl DECIMAL(12,2) NOT NULL,
  unit_price_brl DECIMAL(12,2) NOT NULL,
  comparison_quantities JSONB DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  validity_days INT DEFAULT 7,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, reference_number)
);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_created ON quotes(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(tenant_id, status);

-- ── Audit logs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);

-- ── Payments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50),
  amount_brl DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);

-- ── Row-Level Security ─────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-running
DO $$ BEGIN
  DROP POLICY IF EXISTS tenant_isolation_users ON users;
  DROP POLICY IF EXISTS tenant_isolation_configs ON configs;
  DROP POLICY IF EXISTS tenant_isolation_config_changelog ON config_changelog;
  DROP POLICY IF EXISTS tenant_isolation_clients ON clients;
  DROP POLICY IF EXISTS tenant_isolation_quotes ON quotes;
  DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
  DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
END $$;

CREATE POLICY tenant_isolation_users ON users
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_configs ON configs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_config_changelog ON config_changelog
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_clients ON clients
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_quotes ON quotes
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_payments ON payments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ── Timestamps trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_ts_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_ts_configs BEFORE UPDATE ON configs FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_ts_clients BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_ts_quotes BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Sample data (development) ──────────────────────────────────
INSERT INTO tenants (id, name, plan)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'MOHR Print Shop', 'professional')
ON CONFLICT DO NOTHING;

-- Password: Admin@123 (bcrypt hash)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'admin@mohr.com',
  '$2b$10$QcLO1EFMD.WUXM1uhHQ5UuewNo.gWJ7noIKexopQ2FnStbO.1.37S',
  'Admin', 'MOHR', 'admin'
) ON CONFLICT DO NOTHING;
