-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL, -- Reference to VUFS catalog item
    seller_id UUID NOT NULL REFERENCES users(id),
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
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    location JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Marketplace transactions table
CREATE TABLE IF NOT EXISTS marketplace_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    fees JSONB NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending_payment',
    payment_method VARCHAR(50) NOT NULL,
    payment_id VARCHAR(255),
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(50) DEFAULT 'standard',
    tracking_number VARCHAR(255),
    estimated_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction events table for audit trail
CREATE TABLE IF NOT EXISTS transaction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id),
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('buyer_to_seller', 'seller_to_buyer')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    aspects JSONB NOT NULL,
    helpful INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(transaction_id, reviewer_id, type)
);

-- Review helpful votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES marketplace_reviews(id),
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Review reports table
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES marketplace_reviews(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Listing likes table
CREATE TABLE IF NOT EXISTS listing_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(listing_id, user_id)
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL,
    alerts_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS marketplace_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
    price_alert DECIMAL(10,2),
    notifications JSONB DEFAULT '{"priceDrops": true, "endingSoon": true, "backInStock": true}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_buyer_id ON marketplace_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_seller_id ON marketplace_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_status ON marketplace_transactions(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_created_at ON marketplace_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewee_id ON marketplace_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_type ON marketplace_reviews(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_rating ON marketplace_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_created_at ON marketplace_reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_transaction_events_transaction_id ON transaction_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_events_type ON transaction_events(type);
CREATE INDEX IF NOT EXISTS idx_transaction_events_timestamp ON transaction_events(timestamp);