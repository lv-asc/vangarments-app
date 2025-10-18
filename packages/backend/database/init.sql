-- Initial database schema for Vangarments platform
-- This will be expanded as we implement each feature

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with Brazilian market integration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpf VARCHAR(14) UNIQUE NOT NULL, -- Brazilian personal ID
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile JSONB NOT NULL DEFAULT '{}', -- Flexible profile data
    measurements JSONB DEFAULT '{}', -- Size information across standards
    preferences JSONB DEFAULT '{}', -- Fashion preferences and settings
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User roles and permissions
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- consumer, influencer, brand_owner, etc.
    granted_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

-- VUFS Catalog table based on your comprehensive system
CREATE TABLE vufs_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vufs_code VARCHAR(50) UNIQUE NOT NULL, -- SKU from your system
    domain VARCHAR(20) NOT NULL, -- APPAREL or FOOTWEAR
    item_data JSONB NOT NULL, -- Complete item data (ApparelItem or FootwearItem)
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_domain CHECK (domain IN ('APPAREL', 'FOOTWEAR'))
);

-- Financial records for consignment tracking
CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_sku VARCHAR(50) REFERENCES vufs_catalog(vufs_code),
    owner_name VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255),
    original_price DECIMAL(10,2) NOT NULL,
    sold_price DECIMAL(10,2),
    commission_rate DECIMAL(5,4) DEFAULT 0.30, -- 30%
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

-- Platform exports tracking
CREATE TABLE platform_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_sku VARCHAR(50) REFERENCES vufs_catalog(vufs_code),
    platform VARCHAR(50) NOT NULL,
    exported_at TIMESTAMP DEFAULT NOW(),
    product_id VARCHAR(100), -- Platform-specific product ID
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    export_data JSONB, -- Platform-specific export data
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_platform CHECK (platform IN ('nuvem_shop', 'shopify', 'vinted', 'magazine_luiza', 'ebay', 'google_shopping', 'dropper')),
    CONSTRAINT check_export_status CHECK (status IN ('pending', 'exported', 'published', 'error'))
);

-- Item images with processing status
CREATE TABLE item_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES vufs_items(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) NOT NULL, -- front, back, detail
    processing_status VARCHAR(20) DEFAULT 'pending',
    ai_analysis JSONB DEFAULT '{}', -- AI processing results
    created_at TIMESTAMP DEFAULT NOW()
);

-- Anteroom for incomplete items (14-day completion period)
CREATE TABLE anteroom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_data JSONB NOT NULL DEFAULT '{}', -- Partial VUFS item data
    completion_status JSONB NOT NULL DEFAULT '{}', -- Completion tracking
    reminders JSONB DEFAULT '{"lastSent": null, "count": 0}', -- Reminder tracking
    expires_at TIMESTAMP NOT NULL, -- 14 days from creation
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Item loans tracking
CREATE TABLE item_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES vufs_items(id) ON DELETE CASCADE,
    loanee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    loanee_name VARCHAR(255) NOT NULL,
    loan_date TIMESTAMP NOT NULL,
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Wishlist items
CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_reference UUID REFERENCES vufs_items(id) ON DELETE SET NULL, -- Optional reference to existing item
    desired_item JSONB NOT NULL, -- Description of desired item
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Item usage tracking
CREATE TABLE item_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES vufs_items(id) ON DELETE CASCADE,
    wear_date TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- AI training data for model improvement
CREATE TABLE ai_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url VARCHAR(500) NOT NULL,
    ground_truth_labels JSONB NOT NULL, -- Correct labels for training
    user_feedback JSONB, -- User corrections and feedback
    ai_predictions JSONB, -- AI model predictions for comparison
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Model performance tracking
CREATE TABLE model_performance (
    model_version VARCHAR(50) PRIMARY KEY,
    accuracy_metrics JSONB NOT NULL, -- Accuracy scores by category
    total_samples INTEGER NOT NULL,
    last_evaluated TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Outfits and styling
CREATE TABLE outfits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]', -- Array of OutfitItem objects
    occasion VARCHAR(50) NOT NULL,
    season VARCHAR(20) NOT NULL,
    style TEXT[] DEFAULT '{}', -- Array of style tags
    color_palette TEXT[] DEFAULT '{}', -- Extracted colors from items
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    wear_count INTEGER DEFAULT 0,
    last_worn TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_occasion CHECK (occasion IN ('casual', 'work', 'formal', 'party', 'date', 'workout', 'travel', 'special_event', 'everyday')),
    CONSTRAINT check_season CHECK (season IN ('spring', 'summer', 'fall', 'winter', 'all_season'))
);

-- Outfit photos
CREATE TABLE outfit_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption TEXT,
    location VARCHAR(255),
    is_profile_photo BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Outfit creation sessions (temporary data for outfit building)
CREATE TABLE outfit_creation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_step VARCHAR(50) NOT NULL,
    pinned_item UUID, -- Reference to base item
    selected_items JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    suggestions JSONB DEFAULT '[]',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_creation_step CHECK (current_step IN ('select_base_item', 'add_complementary_items', 'adjust_styling', 'review_outfit', 'save_outfit'))
);

-- Marketplace listings
CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES vufs_catalog(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    condition_info JSONB NOT NULL,
    shipping_options JSONB NOT NULL,
    images TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    watchers INTEGER DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    location JSONB NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_listing_status CHECK (status IN ('draft', 'active', 'sold', 'reserved', 'expired', 'removed', 'under_review'))
);

-- Marketplace transactions
CREATE TABLE marketplace_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_listings(id),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    fees JSONB NOT NULL DEFAULT '{}',
    net_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending_payment',
    payment_method VARCHAR(50) NOT NULL,
    payment_id VARCHAR(100),
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    estimated_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_transaction_status CHECK (status IN ('pending_payment', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed'))
);

-- Transaction events for timeline tracking
CREATE TABLE transaction_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Listing likes
CREATE TABLE listing_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(listing_id, user_id)
);

-- Marketplace reviews
CREATE TABLE marketplace_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES marketplace_transactions(id),
    reviewer_id UUID REFERENCES users(id),
    reviewee_id UUID REFERENCES users(id),
    review_type VARCHAR(20) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    aspects JSONB DEFAULT '{}',
    helpful INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_review_type CHECK (review_type IN ('buyer_to_seller', 'seller_to_buyer'))
);

-- Watchlist for tracking favorite listings
CREATE TABLE marketplace_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    price_alert DECIMAL(10,2),
    notifications JSONB DEFAULT '{"priceDrops": true, "endingSoon": true, "backInStock": true}',
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, listing_id)
);

-- Marketplace offers
CREATE TABLE marketplace_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    counter_offer JSONB,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_offer_status CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'expired'))
);

-- Indexes for performance
CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_email ON users(email);

-- VUFS Catalog indexes
CREATE INDEX idx_vufs_catalog_code ON vufs_catalog(vufs_code);
CREATE INDEX idx_vufs_catalog_domain ON vufs_catalog(domain);
CREATE INDEX idx_vufs_catalog_owner ON vufs_catalog USING GIN((item_data->>'owner'));
CREATE INDEX idx_vufs_catalog_brand ON vufs_catalog USING GIN((item_data->>'brand'));
CREATE INDEX idx_vufs_catalog_status ON vufs_catalog USING GIN((item_data->>'operationalStatus'));
CREATE INDEX idx_vufs_catalog_sold ON vufs_catalog USING GIN((item_data->>'sold'));
CREATE INDEX idx_vufs_catalog_search ON vufs_catalog USING GIN(item_data);

-- Financial records indexes
CREATE INDEX idx_financial_records_sku ON financial_records(item_sku);
CREATE INDEX idx_financial_records_owner ON financial_records(owner_name);
CREATE INDEX idx_financial_records_repass ON financial_records(repass_status);

-- Platform exports indexes
CREATE INDEX idx_platform_exports_sku ON platform_exports(item_sku);
CREATE INDEX idx_platform_exports_platform ON platform_exports(platform);
CREATE INDEX idx_platform_exports_status ON platform_exports(status);

-- AI training indexes
CREATE INDEX idx_ai_training_model_version ON ai_training_data(model_version);
CREATE INDEX idx_ai_training_image_url ON ai_training_data(image_url);
CREATE INDEX idx_ai_training_feedback ON ai_training_data USING GIN(user_feedback);
CREATE INDEX idx_model_performance_version ON model_performance(model_version);

-- Outfit indexes
CREATE INDEX idx_outfits_user ON outfits(user_id);
CREATE INDEX idx_outfits_occasion ON outfits(occasion);
CREATE INDEX idx_outfits_season ON outfits(season);
CREATE INDEX idx_outfits_public ON outfits(is_public);
CREATE INDEX idx_outfits_favorite ON outfits(is_favorite);
CREATE INDEX idx_outfits_style ON outfits USING GIN(style);
CREATE INDEX idx_outfits_colors ON outfits USING GIN(color_palette);
CREATE INDEX idx_outfit_photos_outfit ON outfit_photos(outfit_id);
CREATE INDEX idx_outfit_sessions_user ON outfit_creation_sessions(user_id);
CREATE INDEX idx_outfit_sessions_expires ON outfit_creation_sessions(expires_at);

-- Marketplace indexes
CREATE INDEX idx_marketplace_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_listings_item ON marketplace_listings(item_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX idx_marketplace_listings_price ON marketplace_listings(price);
CREATE INDEX idx_marketplace_listings_tags ON marketplace_listings USING GIN(tags);
CREATE INDEX idx_marketplace_listings_location ON marketplace_listings USING GIN(location);
CREATE INDEX idx_marketplace_listings_created ON marketplace_listings(created_at);
CREATE INDEX idx_marketplace_transactions_listing ON marketplace_transactions(listing_id);
CREATE INDEX idx_marketplace_transactions_buyer ON marketplace_transactions(buyer_id);
CREATE INDEX idx_marketplace_transactions_seller ON marketplace_transactions(seller_id);
CREATE INDEX idx_marketplace_transactions_status ON marketplace_transactions(status);
CREATE INDEX idx_transaction_events_transaction ON transaction_events(transaction_id);
CREATE INDEX idx_listing_likes_listing ON listing_likes(listing_id);
CREATE INDEX idx_listing_likes_user ON listing_likes(user_id);
CREATE INDEX idx_marketplace_reviews_reviewee ON marketplace_reviews(reviewee_id);
CREATE INDEX idx_marketplace_reviews_transaction ON marketplace_reviews(transaction_id);
CREATE INDEX idx_marketplace_watchlist_user ON marketplace_watchlist(user_id);
CREATE INDEX idx_marketplace_watchlist_listing ON marketplace_watchlist(listing_id);
CREATE INDEX idx_marketplace_offers_listing ON marketplace_offers(listing_id);
CREATE INDEX idx_marketplace_offers_buyer ON marketplace_offers(buyer_id);

-- Legacy indexes (keeping for backward compatibility)
CREATE INDEX idx_item_images_item ON item_images(item_id);
CREATE INDEX idx_anteroom_owner ON anteroom_items(owner_id);
CREATE INDEX idx_anteroom_expires ON anteroom_items(expires_at);
CREATE INDEX idx_item_loans_item ON item_loans(item_id);
CREATE INDEX idx_item_loans_loanee ON item_loans(loanee_id);
CREATE INDEX idx_item_loans_dates ON item_loans(loan_date, expected_return_date);
CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX idx_usage_log_item ON item_usage_log(item_id);
CREATE INDEX idx_usage_log_date ON item_usage_log(wear_date);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vufs_catalog_updated_at BEFORE UPDATE ON vufs_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON financial_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_exports_updated_at BEFORE UPDATE ON platform_exports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anteroom_items_updated_at BEFORE UPDATE ON anteroom_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_loans_updated_at BEFORE UPDATE ON item_loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlist_items_updated_at BEFORE UPDATE ON wishlist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_training_data_updated_at BEFORE UPDATE ON ai_training_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_performance_updated_at BEFORE UPDATE ON model_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfits_updated_at BEFORE UPDATE ON outfits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_transactions_updated_at BEFORE UPDATE ON marketplace_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_offers_updated_at BEFORE UPDATE ON marketplace_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Social media and community features

-- Social posts table
CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('outfit', 'item', 'inspiration')),
    content JSONB NOT NULL,
    wardrobe_item_ids UUID[] DEFAULT '{}',
    engagement_stats JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0}',
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User follows table
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Post comments table
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 500),
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Post likes table
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Social media indexes
CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_type ON social_posts(post_type);
CREATE INDEX idx_social_posts_visibility ON social_posts(visibility);
CREATE INDEX idx_social_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX idx_social_posts_wardrobe_items ON social_posts USING gin(wardrobe_item_ids);

CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON user_follows(created_at DESC);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_comment_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at DESC);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at DESC);

-- Social media update triggers
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Brand partnership and integration system

-- Brand accounts table
CREATE TABLE brand_accounts (
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
CREATE TABLE brand_catalog_items (
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
CREATE TABLE commissions (
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
CREATE TABLE partnership_agreements (
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
CREATE TABLE brand_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    badge_type VARCHAR(20) NOT NULL CHECK (badge_type IN ('beta_pioneer', 'verified_brand', 'premium_partner', 'custom')),
    icon_url VARCHAR(500),
    color VARCHAR(7), -- Hex color code
    criteria JSONB, -- Criteria for earning the badge
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Brand analytics table for performance tracking
CREATE TABLE brand_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    catalog_views INTEGER DEFAULT 0,
    item_clicks INTEGER DEFAULT 0,
    purchase_conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    commission_earned DECIMAL(10,2) DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brand_id, metric_date)
);

-- Brand partnership indexes
CREATE INDEX idx_brand_accounts_user_id ON brand_accounts(user_id);
CREATE INDEX idx_brand_accounts_verification ON brand_accounts(verification_status);
CREATE INDEX idx_brand_accounts_tier ON brand_accounts(partnership_tier);
CREATE INDEX idx_brand_accounts_name ON brand_accounts USING GIN((brand_info->>'name'));

CREATE INDEX idx_brand_catalog_brand_id ON brand_catalog_items(brand_id);
CREATE INDEX idx_brand_catalog_vufs_item ON brand_catalog_items(vufs_item_id);
CREATE INDEX idx_brand_catalog_availability ON brand_catalog_items(availability_status);
CREATE INDEX idx_brand_catalog_price ON brand_catalog_items(official_price);
CREATE INDEX idx_brand_catalog_collection ON brand_catalog_items USING GIN((brand_specific_data->>'collection'));

CREATE INDEX idx_commissions_transaction ON commissions(transaction_id);
CREATE INDEX idx_commissions_brand ON commissions(brand_id);
CREATE INDEX idx_commissions_store ON commissions(store_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_date ON commissions(created_at);

CREATE INDEX idx_partnership_agreements_brand ON partnership_agreements(brand_id);
CREATE INDEX idx_partnership_agreements_partner ON partnership_agreements(partner_id);
CREATE INDEX idx_partnership_agreements_type ON partnership_agreements(agreement_type);
CREATE INDEX idx_partnership_agreements_status ON partnership_agreements(status);

CREATE INDEX idx_brand_analytics_brand_date ON brand_analytics(brand_id, metric_date);
CREATE INDEX idx_brand_analytics_date ON brand_analytics(metric_date);

-- Brand partnership update triggers
CREATE TRIGGER update_brand_accounts_updated_at BEFORE UPDATE ON brand_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_catalog_items_updated_at BEFORE UPDATE ON brand_catalog_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partnership_agreements_updated_at BEFORE UPDATE ON partnership_agreements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business features for brands

-- User badges table for tracking awarded badges
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES brand_badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT NOW(),
    awarded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    UNIQUE(user_id, badge_id)
);

-- Inventory management tables
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
    catalog_item_id UUID NOT NULL REFERENCES brand_catalog_items(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    location VARCHAR(255),
    supplier VARCHAR(255),
    last_restocked TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brand_id, sku)
);

-- Inventory movements for tracking stock changes
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'reserved', 'released')),
    quantity INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference VARCHAR(100), -- Order ID, return ID, etc.
    performed_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Client acquisition and portfolio tables
CREATE TABLE brand_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
    client_type VARCHAR(20) NOT NULL CHECK (client_type IN ('individual', 'business', 'influencer', 'retailer')),
    contact_info JSONB NOT NULL,
    preferences JSONB DEFAULT '{}',
    acquisition_source VARCHAR(100),
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    last_interaction TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Brand portfolio items for showcasing work
CREATE TABLE brand_portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    images JSONB DEFAULT '[]', -- Array of image URLs
    tags TEXT[] DEFAULT '{}',
    client_id UUID REFERENCES brand_clients(id) ON DELETE SET NULL,
    project_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'clients_only')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Business features indexes
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_awarded_at ON user_badges(awarded_at DESC);

CREATE INDEX idx_inventory_items_brand_id ON inventory_items(brand_id);
CREATE INDEX idx_inventory_items_catalog_item ON inventory_items(catalog_item_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(available_quantity, reorder_level);

CREATE INDEX idx_inventory_movements_item_id ON inventory_movements(inventory_item_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at DESC);

CREATE INDEX idx_brand_clients_brand_id ON brand_clients(brand_id);
CREATE INDEX idx_brand_clients_type ON brand_clients(client_type);
CREATE INDEX idx_brand_clients_status ON brand_clients(status);
CREATE INDEX idx_brand_clients_acquisition ON brand_clients(acquisition_source);

CREATE INDEX idx_brand_portfolio_brand_id ON brand_portfolio(brand_id);
CREATE INDEX idx_brand_portfolio_category ON brand_portfolio(category);
CREATE INDEX idx_brand_portfolio_featured ON brand_portfolio(is_featured);
CREATE INDEX idx_brand_portfolio_visibility ON brand_portfolio(visibility);
CREATE INDEX idx_brand_portfolio_tags ON brand_portfolio USING GIN(tags);

-- Business features update triggers
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_clients_updated_at BEFORE UPDATE ON brand_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_portfolio_updated_at BEFORE UPDATE ON brand_portfolio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Beta program and industry partnerships

-- Beta participants table
CREATE TABLE beta_participants (
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
CREATE TABLE beta_feedback (
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

-- Industry partnerships table
CREATE TABLE industry_partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50) NOT NULL CHECK (partner_type IN ('fashion_brand', 'retailer', 'media_company', 'technology_partner', 'educational_institution')),
    contact_info JSONB NOT NULL,
    partnership_level VARCHAR(20) DEFAULT 'basic' CHECK (partnership_level IN ('basic', 'premium', 'strategic')),
    benefits JSONB DEFAULT '{}',
    contract_details JSONB DEFAULT '{}',
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'terminated')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Referral rewards table
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES beta_participants(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL,
    reward_value JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'awarded', 'redeemed')),
    awarded_at TIMESTAMP,
    redeemed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Beta program indexes
CREATE INDEX idx_beta_participants_user_id ON beta_participants(user_id);
CREATE INDEX idx_beta_participants_type ON beta_participants(participant_type);
CREATE INDEX idx_beta_participants_status ON beta_participants(status);
CREATE INDEX idx_beta_participants_referral ON beta_participants(referral_code);
CREATE INDEX idx_beta_participants_invited_by ON beta_participants(invited_by);

CREATE INDEX idx_beta_feedback_participant ON beta_feedback(participant_id);
CREATE INDEX idx_beta_feedback_type ON beta_feedback(feedback_type);
CREATE INDEX idx_beta_feedback_status ON beta_feedback(status);
CREATE INDEX idx_beta_feedback_priority ON beta_feedback(priority);
CREATE INDEX idx_beta_feedback_created ON beta_feedback(created_at DESC);

CREATE INDEX idx_industry_partnerships_type ON industry_partnerships(partner_type);
CREATE INDEX idx_industry_partnerships_level ON industry_partnerships(partnership_level);
CREATE INDEX idx_industry_partnerships_status ON industry_partnerships(status);

CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_referred ON referral_rewards(referred_user_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);

-- Beta program update triggers
CREATE TRIGGER update_beta_participants_updated_at BEFORE UPDATE ON beta_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beta_feedback_updated_at BEFORE UPDATE ON beta_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_partnerships_updated_at BEFORE UPDATE ON industry_partnerships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Premium advertising and data intelligence system

-- Advertising campaigns table
CREATE TABLE advertising_campaigns (
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
CREATE TABLE ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_placement VARCHAR(50) NOT NULL,
    user_context JSONB DEFAULT '{}',
    targeting JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Ad clicks tracking
CREATE TABLE ad_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impression_id UUID NOT NULL REFERENCES ad_impressions(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_url VARCHAR(500) NOT NULL,
    conversion_tracked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP DEFAULT NOW()
);

-- Ad conversions tracking
CREATE TABLE ad_conversions (
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
CREATE TABLE fashion_trend_reports (
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
CREATE TABLE market_intelligence_reports (
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
CREATE TABLE user_behavior_analytics (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    fashion_dna JSONB DEFAULT '{}',
    engagement_patterns JSONB DEFAULT '{}',
    purchase_intent JSONB DEFAULT '{}',
    wardrobe_analytics JSONB DEFAULT '{}',
    social_metrics JSONB DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Advertising and analytics indexes
CREATE INDEX idx_advertising_campaigns_advertiser ON advertising_campaigns(advertiser_id);
CREATE INDEX idx_advertising_campaigns_status ON advertising_campaigns(status);
CREATE INDEX idx_advertising_campaigns_type ON advertising_campaigns(campaign_type);
CREATE INDEX idx_advertising_campaigns_created ON advertising_campaigns(created_at DESC);

CREATE INDEX idx_ad_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_placement ON ad_impressions(ad_placement);
CREATE INDEX idx_ad_impressions_timestamp ON ad_impressions(timestamp DESC);

CREATE INDEX idx_ad_clicks_impression ON ad_clicks(impression_id);
CREATE INDEX idx_ad_clicks_campaign ON ad_clicks(campaign_id);
CREATE INDEX idx_ad_clicks_user ON ad_clicks(user_id);
CREATE INDEX idx_ad_clicks_timestamp ON ad_clicks(clicked_at DESC);

CREATE INDEX idx_ad_conversions_click ON ad_conversions(click_id);
CREATE INDEX idx_ad_conversions_campaign ON ad_conversions(campaign_id);
CREATE INDEX idx_ad_conversions_user ON ad_conversions(user_id);
CREATE INDEX idx_ad_conversions_type ON ad_conversions(conversion_type);
CREATE INDEX idx_ad_conversions_timestamp ON ad_conversions(converted_at DESC);

CREATE INDEX idx_fashion_trend_reports_type ON fashion_trend_reports(report_type);
CREATE INDEX idx_fashion_trend_reports_access ON fashion_trend_reports(access_level);
CREATE INDEX idx_fashion_trend_reports_created ON fashion_trend_reports(created_at DESC);

CREATE INDEX idx_market_intelligence_category ON market_intelligence_reports(category);
CREATE INDEX idx_market_intelligence_access ON market_intelligence_reports(access_level);
CREATE INDEX idx_market_intelligence_confidence ON market_intelligence_reports(confidence_level);
CREATE INDEX idx_market_intelligence_created ON market_intelligence_reports(created_at DESC);

CREATE INDEX idx_user_behavior_analytics_updated ON user_behavior_analytics(last_updated DESC);

-- Advertising and analytics update triggers
CREATE TRIGGER update_advertising_campaigns_updated_at BEFORE UPDATE ON advertising_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fashion_trend_reports_updated_at BEFORE UPDATE ON fashion_trend_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();