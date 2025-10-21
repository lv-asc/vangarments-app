/*
  # Advertising, Analytics, and AI Training Tables
  
  ## Tables Created
  
  1. **advertising_campaigns** - Marketing campaigns
  2. **ad_impressions** - Ad view tracking
  3. **ad_clicks** - Click tracking
  4. **ad_conversions** - Conversion tracking
  5. **fashion_trend_reports** - Trend analysis
  6. **market_intelligence_reports** - Market insights
  7. **user_behavior_analytics** - User fashion DNA
  8. **ai_training_data** - AI model training data
  9. **model_performance** - AI model metrics
  10. **financial_records** - Consignment tracking
  11. **content_reports** - Content moderation
  
  ## Security
  - Advertisers manage their campaigns
  - Analytics restricted to data owners
  - AI training data properly secured
*/

-- Advertising campaigns table
CREATE TABLE IF NOT EXISTS advertising_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('brand_awareness', 'product_promotion', 'marketplace_listing', 'sponsored_content')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    budget JSONB NOT NULL,
    targeting JSONB NOT NULL,
    creative_assets JSONB NOT NULL,
    placements TEXT[] DEFAULT '{}',
    schedule JSONB NOT NULL,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad impressions tracking
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_placement VARCHAR(50) NOT NULL,
    user_context JSONB DEFAULT '{}',
    targeting JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Ad clicks tracking
CREATE TABLE IF NOT EXISTS ad_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impression_id UUID NOT NULL REFERENCES ad_impressions(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_url VARCHAR(500) NOT NULL,
    conversion_tracked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP DEFAULT NOW()
);

-- Ad conversions tracking
CREATE TABLE IF NOT EXISTS ad_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    click_id UUID NOT NULL REFERENCES ad_clicks(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversion_type VARCHAR(50) NOT NULL CHECK (conversion_type IN ('purchase', 'signup', 'add_to_cart', 'wishlist', 'follow')),
    conversion_value DECIMAL(10,2) DEFAULT 0,
    conversion_data JSONB DEFAULT '{}',
    converted_at TIMESTAMP DEFAULT NOW()
);

-- Fashion trend reports
CREATE TABLE IF NOT EXISTS fashion_trend_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'seasonal', 'custom')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date_range JSONB NOT NULL,
    data JSONB NOT NULL,
    insights TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    access_level VARCHAR(20) DEFAULT 'public' CHECK (access_level IN ('public', 'premium', 'enterprise')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Market intelligence reports
CREATE TABLE IF NOT EXISTS market_intelligence_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('market_overview', 'brand_analysis', 'consumer_behavior', 'price_intelligence', 'trend_forecast')),
    data JSONB NOT NULL,
    methodology TEXT NOT NULL,
    data_points INTEGER NOT NULL,
    confidence_level INTEGER NOT NULL CHECK (confidence_level BETWEEN 0 AND 100),
    access_level VARCHAR(20) DEFAULT 'premium' CHECK (access_level IN ('public', 'premium', 'enterprise')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User behavior analytics (for personalized recommendations)
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    fashion_dna JSONB DEFAULT '{}',
    engagement_patterns JSONB DEFAULT '{}',
    purchase_intent JSONB DEFAULT '{}',
    wardrobe_analytics JSONB DEFAULT '{}',
    social_metrics JSONB DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- AI training data for model improvement
CREATE TABLE IF NOT EXISTS ai_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url VARCHAR(500) NOT NULL,
    ground_truth_labels JSONB NOT NULL,
    user_feedback JSONB,
    ai_predictions JSONB,
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Model performance tracking
CREATE TABLE IF NOT EXISTS model_performance (
    model_version VARCHAR(50) PRIMARY KEY,
    accuracy_metrics JSONB NOT NULL,
    total_samples INTEGER NOT NULL,
    last_evaluated TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial records for consignment tracking
CREATE TABLE IF NOT EXISTS financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_sku VARCHAR(50),
    owner_name VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255),
    original_price DECIMAL(10,2) NOT NULL,
    sold_price DECIMAL(10,2),
    commission_rate DECIMAL(5,4) DEFAULT 0.30,
    platform_fees DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    amount_to_owner DECIMAL(10,2),
    repass_status BOOLEAN DEFAULT FALSE,
    repass_date TIMESTAMP,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content moderation reports
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'comment', 'listing', 'profile', 'message')),
    content_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'copyright', 'fake', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    last_modified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advertising_campaigns_advertiser ON advertising_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertising_campaigns_status ON advertising_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_timestamp ON ad_impressions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON ad_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_user ON ad_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_conversions_campaign ON ad_conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_conversions_type ON ad_conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_fashion_trend_reports_type ON fashion_trend_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_fashion_trend_reports_access ON fashion_trend_reports(access_level);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_category ON market_intelligence_reports(category);
CREATE INDEX IF NOT EXISTS idx_ai_training_model_version ON ai_training_data(model_version);
CREATE INDEX IF NOT EXISTS idx_financial_records_sku ON financial_records(item_sku);
CREATE INDEX IF NOT EXISTS idx_financial_records_repass ON financial_records(repass_status);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_type ON content_reports(content_type);

-- Update triggers
CREATE TRIGGER update_advertising_campaigns_updated_at BEFORE UPDATE ON advertising_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fashion_trend_reports_updated_at BEFORE UPDATE ON fashion_trend_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_training_data_updated_at BEFORE UPDATE ON ai_training_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_performance_updated_at BEFORE UPDATE ON model_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON financial_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configurations_updated_at BEFORE UPDATE ON system_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE advertising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fashion_trend_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertising_campaigns
CREATE POLICY "Advertisers can view own campaigns"
  ON advertising_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = advertiser_id);

CREATE POLICY "Advertisers can create campaigns"
  ON advertising_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Advertisers can update own campaigns"
  ON advertising_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = advertiser_id)
  WITH CHECK (auth.uid() = advertiser_id);

-- RLS Policies for ad impressions/clicks/conversions (analytics data)
CREATE POLICY "Advertisers can view own campaign impressions"
  ON ad_impressions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM advertising_campaigns
      WHERE advertising_campaigns.id = ad_impressions.campaign_id
      AND advertising_campaigns.advertiser_id = auth.uid()
    )
  );

CREATE POLICY "Advertisers can view own campaign clicks"
  ON ad_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM advertising_campaigns
      WHERE advertising_campaigns.id = ad_clicks.campaign_id
      AND advertising_campaigns.advertiser_id = auth.uid()
    )
  );

CREATE POLICY "Advertisers can view own campaign conversions"
  ON ad_conversions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM advertising_campaigns
      WHERE advertising_campaigns.id = ad_conversions.campaign_id
      AND advertising_campaigns.advertiser_id = auth.uid()
    )
  );

-- RLS Policies for trend reports (based on access level)
CREATE POLICY "Users can view public trend reports"
  ON fashion_trend_reports FOR SELECT
  TO authenticated
  USING (access_level = 'public');

CREATE POLICY "Premium users can view premium reports"
  ON fashion_trend_reports FOR SELECT
  TO authenticated
  USING (
    access_level = 'premium' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('premium', 'brand_owner', 'influencer')
    )
  );

-- RLS Policies for market intelligence
CREATE POLICY "Users can view public intelligence reports"
  ON market_intelligence_reports FOR SELECT
  TO authenticated
  USING (access_level = 'public');

-- RLS Policies for user_behavior_analytics
CREATE POLICY "Users can view own analytics"
  ON user_behavior_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON user_behavior_analytics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for content_reports
CREATE POLICY "Users can view own reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- RLS Policies for system_configurations
CREATE POLICY "Users can view public configurations"
  ON system_configurations FOR SELECT
  TO authenticated
  USING (is_public = true);
