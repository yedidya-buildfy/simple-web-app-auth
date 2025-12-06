-- InvoiceMatch Database Schema
-- Version: 1.0.0
-- Generated: 2025-12-05

-- ============================================
-- Enable Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- Users Settings (extends Supabase auth.users)
-- ============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  default_currency TEXT DEFAULT 'ILS',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Businesses (user-defined)
-- ============================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tax_id TEXT,
  logo_url TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- ============================================
-- Categories (income/expense categories)
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name, type)
);

-- ============================================
-- Vendor Aliases (for smart matching)
-- ============================================
CREATE TABLE vendor_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, primary_name)
);

-- Insert system-wide aliases (user_id = NULL)
INSERT INTO vendor_aliases (user_id, primary_name, aliases) VALUES
  (NULL, 'meta', ARRAY['meta', 'facebook', 'fb', 'פייסבוק', 'instagram', 'אינסטגרם']),
  (NULL, 'google', ARRAY['google', 'גוגל', 'youtube', 'יוטיוב', 'gcp', 'google ads']),
  (NULL, 'alibaba', ARRAY['alibaba', 'עליבאבא', 'אליבאבא', '1688', 'aliexpress']),
  (NULL, 'tiktok', ARRAY['tiktok', 'טיקטוק', 'bytedance', 'בייטדאנס']),
  (NULL, 'paypal', ARRAY['paypal', 'פייפאל']),
  (NULL, 'stripe', ARRAY['stripe', 'סטרייפ']);

-- ============================================
-- Files (uploaded files)
-- ============================================
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('excel', 'csv', 'pdf', 'image')),
  source_type TEXT NOT NULL CHECK (source_type IN ('bank', 'credit_card', 'invoice')),
  storage_path TEXT NOT NULL,
  file_size INTEGER,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,

  items_count INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Transactions
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Core data
  date DATE NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'ILS',
  reference TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('income', 'expense', 'transfer', 'credit_detail')),

  -- Invoice linking
  invoice_id UUID,
  has_vat TEXT DEFAULT 'N/A' CHECK (has_vat IN ('yes', 'no', 'N/A')),
  vat_amount DECIMAL(15,2) DEFAULT 0,

  -- Match quality indicator
  match_quality TEXT CHECK (match_quality IN ('exact', 'partial_amount', 'partial_date', 'ai_matched')),
  match_color TEXT,

  -- Deduplication
  hash TEXT NOT NULL,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, hash)
);

-- ============================================
-- Invoices
-- ============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,

  -- Document info
  vendor_name TEXT,
  document_date DATE,
  document_type TEXT CHECK (document_type IN ('invoice', 'receipt', 'credit_note', 'quote', 'other')),
  document_number TEXT,

  -- Amounts
  total_amount DECIMAL(15,2),
  subtotal DECIMAL(15,2),
  vat_amount DECIMAL(15,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  has_vat BOOLEAN DEFAULT FALSE,
  currency TEXT DEFAULT 'ILS',

  -- Storage
  storage_path TEXT,
  thumbnail_path TEXT,

  -- AI extraction confidence
  extraction_confidence DECIMAL(3,2),
  raw_extraction JSONB,

  -- Matching status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'partially_matched', 'unmatched', 'manual')),
  matched_transactions_count INTEGER DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for invoice_id in transactions
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_invoice
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- ============================================
-- Invoice Rows (for multi-line invoices)
-- ============================================
CREATE TABLE invoice_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,

  date DATE,
  description TEXT,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(15,2),
  amount DECIMAL(15,2) NOT NULL,
  reference TEXT,

  -- Matching
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  matched BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Duplicates Log
-- ============================================
CREATE TABLE duplicates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  hash TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),

  -- Original data for reference
  source_file TEXT,
  date DATE,
  source TEXT,
  description TEXT,
  amount DECIMAL(15,2),
  currency TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Matching Rules (user-defined)
-- ============================================
CREATE TABLE matching_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  -- Conditions (JSONB for flexibility)
  conditions JSONB NOT NULL,

  -- Actions
  auto_match BOOLEAN DEFAULT FALSE,
  assign_business_id UUID REFERENCES businesses(id),
  assign_category_id UUID REFERENCES categories(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_hash ON transactions(user_id, hash);
CREATE INDEX idx_transactions_amount ON transactions(user_id, amount);
CREATE INDEX idx_transactions_no_invoice ON transactions(user_id) WHERE invoice_id IS NULL;
CREATE INDEX idx_transactions_description_trgm ON transactions USING GIN(description gin_trgm_ops);

CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_user_date ON invoices(user_id, document_date DESC);
CREATE INDEX idx_invoices_vendor ON invoices(user_id, vendor_name);

CREATE INDEX idx_files_user_status ON files(user_id, status);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own businesses" ON businesses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access vendor aliases" ON vendor_aliases
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users manage own vendor aliases" ON vendor_aliases
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own files" ON files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own invoices" ON invoices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own invoice rows" ON invoice_rows
  FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own duplicates" ON duplicates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own matching rules" ON matching_rules
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create default data for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user settings
  INSERT INTO user_settings (id) VALUES (NEW.id);

  -- Create default categories
  INSERT INTO categories (user_id, name, type, icon) VALUES
    (NEW.id, 'מכירות', 'income', '💰'),
    (NEW.id, 'שירותים', 'income', '🛠️'),
    (NEW.id, 'ספקים', 'expense', '📦'),
    (NEW.id, 'משכורות', 'expense', '👥'),
    (NEW.id, 'שיווק', 'expense', '📢'),
    (NEW.id, 'משרד', 'expense', '🏢'),
    (NEW.id, 'נסיעות', 'expense', '✈️'),
    (NEW.id, 'העברה פנימית', 'transfer', '🔄');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
