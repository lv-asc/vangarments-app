-- Performance optimization indexes for Vangarments platform
-- These indexes are designed to optimize common query patterns

-- Additional indexes for better performance on frequently queried columns

-- Users table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_gin ON users USING GIN(profile);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_preferences_gin ON users USING GIN(preferences);

-- VUFS Items table optimizations (if exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vufs_items_user_id ON vufs_items(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vufs_items_created_at ON vufs_items(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vufs_items_updated_at ON vufs_items(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vufs_items_category ON vufs_items(category) WHERE category IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vufs_items_brand ON vufs_items(brand) WHERE brand IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vufs_items_active ON vufs_items(is_active) WHERE is_active = true;

-- Marketplace listings performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_price_range ON marketplace_listings(price) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_updated_at ON marketplace_listings(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_views ON marketplace_listings(views DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_likes_count ON marketplace_listings(likes DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_expires_at ON marketplace_listings(expires_at) WHERE expires_at IS NOT NULL;

-- Composite indexes for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_category_price ON marketplace_listings(category, price) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_seller_status ON marketplace_listings(seller_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_category_created ON marketplace_listings(category, created_at DESC) WHERE status = 'active';

-- Social posts performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_user_created ON social_posts(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_type_created ON social_posts(post_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_visibility_created ON social_posts(visibility, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_engagement ON social_posts USING GIN(engagement_stats);

-- User follows performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_following_created ON user_follows(following_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_follower_created ON user_follows(follower_id, created_at DESC);

-- Post comments performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_user_created ON post_comments(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_parent_created ON post_comments(parent_comment_id, created_at DESC) WHERE parent_comment_id IS NOT NULL;

-- Post likes performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_likes_post_created ON post_likes(post_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_likes_user_created ON post_likes(user_id, created_at DESC);

-- Outfits performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_user_created ON outfits(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_public_created ON outfits(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_favorite_user ON outfits(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_occasion_season ON outfits(occasion, season);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_wear_count ON outfits(wear_count DESC) WHERE wear_count > 0;

-- Item images performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_images_processing_status ON item_images(processing_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_images_type ON item_images(image_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_images_created_at ON item_images(created_at DESC);

-- Marketplace transactions performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_transactions_buyer_created ON marketplace_transactions(buyer_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_transactions_seller_created ON marketplace_transactions(seller_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_transactions_status_created ON marketplace_transactions(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_transactions_amount ON marketplace_transactions(amount DESC);

-- System configurations performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_configurations_section ON system_configurations(section);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_configurations_key ON system_configurations(key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_configurations_editable ON system_configurations(is_editable) WHERE is_editable = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_configurations_modified ON system_configurations(last_modified DESC);

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_active_listings ON marketplace_listings(created_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_sold_listings ON marketplace_listings(updated_at DESC) WHERE status = 'sold';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_public_posts ON social_posts(created_at DESC) WHERE visibility = 'public';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_profiles ON users(updated_at DESC) WHERE profile IS NOT NULL;

-- Text search indexes for better search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_title_search ON marketplace_listings USING gin(to_tsvector('english', title)) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_description_search ON marketplace_listings USING gin(to_tsvector('english', description)) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_search ON users USING gin(to_tsvector('english', (profile->>'name'))) WHERE profile->>'name' IS NOT NULL;

-- Analyze tables to update statistics after creating indexes
ANALYZE users;
ANALYZE vufs_catalog;
ANALYZE marketplace_listings;
ANALYZE marketplace_transactions;
ANALYZE social_posts;
ANALYZE user_follows;
ANALYZE post_comments;
ANALYZE post_likes;
ANALYZE outfits;
ANALYZE item_images;
ANALYZE system_configurations;