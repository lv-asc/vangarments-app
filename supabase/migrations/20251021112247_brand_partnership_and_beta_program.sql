/*
  # Brand Partnership and Beta Program Tables
  
  ## Tables Created
  
  1. **brand_accounts** - Official brand accounts
  2. **brand_catalog_items** - Brand product catalogs
  3. **commissions** - Commission tracking for sales
  4. **partnership_agreements** - Brand-store partnerships
  5. **brand_badges** - Special recognition badges
  6. **user_badges** - User badge awards
  7. **beta_participants** - Beta program members
  8. **beta_feedback** - Beta tester feedback
  
  ## Security
  - Brands manage their own data
  - Beta participants have special access
  - Commission data restricted to involved parties
*/

-- Brand accounts table
CREATE TABLE IF NOT EXISTS brand_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_info JSONB NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    partnership_tier VARCHAR(20) DEFAULT 'basic' CHECK (partnership_tier IN ('basic', 'premium', 'enterprise')),
    badges JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Brand catalog items table
CREATE TABLE IF NOT EXISTS brand_catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
    vufs_item_id UUID NOT NULL REFERENCES vufs_catalog(id) ON DELETE CASCADE,
    official_price DECIMAL(10,2),
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'out_of_stock', 'discontinued', 'pre_order')),
    purchase_link VARCHAR(500),
    brand_specific_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brand_id, vufs_item_id)
);

-- Commission tracking table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
    store_id UUID REFERENCES brand_accounts(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
    payment_method VARCHAR(50),
    payment_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Partnership agreements table
CREATE TABLE IF NOT EXISTS partnership_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES brand_accounts(id) ON DELETE SET NULL,
    agreement_type VARCHAR(20) NOT NULL CHECK (agreement_type IN ('brand_store', 'collaboration', 'licensing', 'affiliate')),
    terms JSONB NOT NULL,
    commission_structure JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'expired', 'terminated')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Brand badges table for special recognition
CREATE TABLE IF NOT EXISTS brand_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    badge_type VARCHAR(20) NOT NULL CHECK (badge_type IN ('beta_pioneer', 'verified_brand', 'premium_partner', 'custom')),
    icon_url VARCHAR(500),
    color VARCHAR(7),
    criteria JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User badges table for tracking awarded badges
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES brand_badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT NOW(),
    awarded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    UNIQUE(user_id, badge_id)
);

-- Beta participants table
CREATE TABLE IF NOT EXISTS beta_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_type VARCHAR(20) NOT NULL CHECK (participant_type IN ('brand', 'influencer', 'stylist', 'model', 'designer', 'industry_leader')),
    joined_at TIMESTAMP DEFAULT NOW(),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    referral_code VARCHAR(10) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'inactive')),
    privileges JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    graduation_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Beta feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES beta_participants(id) ON DELETE CASCADE,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'improvement', 'general')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'in_progress', 'completed', 'rejected')),
    attachments JSONB DEFAULT '[]',
    response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_accounts_user_id ON brand_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_accounts_verification ON brand_accounts(verification_status);
CREATE INDEX IF NOT EXISTS idx_brand_accounts_tier ON brand_accounts(partnership_tier);
CREATE INDEX IF NOT EXISTS idx_brand_catalog_brand_id ON brand_catalog_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_catalog_vufs_item ON brand_catalog_items(vufs_item_id);
CREATE INDEX IF NOT EXISTS idx_commissions_transaction ON commissions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commissions_brand ON commissions(brand_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_beta_participants_user_id ON beta_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_participants_referral ON beta_participants(referral_code);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_participant ON beta_feedback(participant_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Update triggers
CREATE TRIGGER update_brand_accounts_updated_at BEFORE UPDATE ON brand_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_catalog_items_updated_at BEFORE UPDATE ON brand_catalog_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partnership_agreements_updated_at BEFORE UPDATE ON partnership_agreements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beta_participants_updated_at BEFORE UPDATE ON beta_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beta_feedback_updated_at BEFORE UPDATE ON beta_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE brand_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_accounts
CREATE POLICY "Users can view verified brand accounts"
  ON brand_accounts FOR SELECT
  TO authenticated
  USING (verification_status = 'verified' OR user_id = auth.uid());

CREATE POLICY "Users can create brand account"
  ON brand_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand account"
  ON brand_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for brand_catalog_items
CREATE POLICY "Users can view all brand catalog items"
  ON brand_catalog_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Brand owners can manage catalog"
  ON brand_catalog_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM brand_accounts
      WHERE brand_accounts.id = brand_catalog_items.brand_id
      AND brand_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for commissions
CREATE POLICY "Users can view own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM brand_accounts
      WHERE brand_accounts.id = commissions.brand_id
      AND brand_accounts.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM brand_accounts
      WHERE brand_accounts.id = commissions.store_id
      AND brand_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for beta_participants
CREATE POLICY "Beta participants can view all participants"
  ON beta_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM beta_participants bp
      WHERE bp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own beta participation"
  ON beta_participants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for beta_feedback
CREATE POLICY "Participants can view own feedback"
  ON beta_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM beta_participants
      WHERE beta_participants.id = beta_feedback.participant_id
      AND beta_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can create feedback"
  ON beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM beta_participants
      WHERE beta_participants.id = beta_feedback.participant_id
      AND beta_participants.user_id = auth.uid()
    )
  );

-- RLS Policies for brand_badges (public read)
CREATE POLICY "Anyone can view active badges"
  ON brand_badges FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view all user badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);
