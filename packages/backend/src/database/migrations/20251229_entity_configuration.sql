-- Entity Configuration Table
-- Stores feature toggles and label customizations for each entity type

CREATE TABLE IF NOT EXISTS entity_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    display_name_plural VARCHAR(100) NOT NULL,
    url_path VARCHAR(100) NOT NULL,
    
    -- Feature toggles
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Label customizations  
    labels JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Tab configuration (which tabs appear in edit page)
    tabs JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configurations
INSERT INTO entity_configuration (entity_type, display_name, display_name_plural, url_path, features, labels, tabs) VALUES
('brand', 'Brand', 'Brands', '/brands',
 '{"logos": true, "logoNames": true, "banners": true, "team": true, "lines": true, "collections": true, "lookbooks": true, "skus": true, "socialLinks": false, "foundedInfo": true, "country": true, "tags": true}'::jsonb,
 '{"logos": {"label": "Brand Logos", "button": "Upload Logo(s)", "helper": "The first image is the main one. Drag to reorder."}, "banners": {"label": "Brand Banners", "button": "Upload Banner(s)"}}'::jsonb,
 '[{"id": "details", "label": "Details"}, {"id": "lines", "label": "Lines"}, {"id": "collections", "label": "Collections"}, {"id": "lookbooks", "label": "Lookbooks"}, {"id": "skus", "label": "SKUs"}, {"id": "team", "label": "Team"}]'::jsonb),
 
('store', 'Store', 'Stores', '/stores',
 '{"logos": true, "logoNames": true, "banners": true, "team": true, "lines": false, "collections": true, "lookbooks": true, "skus": true, "socialLinks": true, "foundedInfo": true, "country": true, "tags": true}'::jsonb,
 '{"logos": {"label": "Store Logos", "button": "Upload Logo(s)"}, "banners": {"label": "Store Banners", "button": "Upload Banner(s)"}}'::jsonb,
 '[{"id": "details", "label": "Details"}, {"id": "drops", "label": "Drops"}, {"id": "lookbooks", "label": "Lookbooks"}, {"id": "skus", "label": "SKUs"}, {"id": "team", "label": "Team"}]'::jsonb),
 
('supplier', 'Supplier', 'Suppliers', '/suppliers',
 '{"logos": true, "logoNames": true, "banners": true, "team": true, "lines": false, "collections": false, "lookbooks": false, "skus": false, "socialLinks": true, "foundedInfo": true, "country": true, "tags": true}'::jsonb,
 '{"logos": {"label": "Supplier Logos", "button": "Upload Logo(s)"}, "banners": {"label": "Supplier Banners", "button": "Upload Banner(s)"}}'::jsonb,
 '[{"id": "details", "label": "Details"}, {"id": "team", "label": "Team"}]'::jsonb),
 
('non_profit', 'Non-Profit', 'Non-Profits', '/non-profits',
 '{"logos": true, "logoNames": true, "banners": true, "team": true, "lines": false, "collections": false, "lookbooks": false, "skus": false, "socialLinks": false, "foundedInfo": false, "country": true, "tags": false}'::jsonb,
 '{"logos": {"label": "Non-Profit Logos", "button": "Upload Logo(s)"}, "banners": {"label": "Non-Profit Banners", "button": "Upload Banner(s)"}}'::jsonb,
 '[{"id": "details", "label": "Details"}, {"id": "team", "label": "Team"}]'::jsonb),
 
('page', 'Page', 'Pages', '/pages',
 '{"logos": true, "logoNames": true, "banners": true, "team": true, "lines": false, "collections": false, "lookbooks": false, "skus": false, "socialLinks": true, "foundedInfo": true, "country": false, "tags": false}'::jsonb,
 '{"logos": {"label": "Page Logos", "button": "Upload Logo(s)"}, "banners": {"label": "Page Banners", "button": "Upload Banner(s)"}}'::jsonb,
 '[{"id": "details", "label": "Details"}, {"id": "articles", "label": "Articles"}, {"id": "team", "label": "Team"}]'::jsonb),
 
('user', 'User', 'Users', '/users',
 '{"avatar": true, "banners": false, "team": false, "socialLinks": true, "roles": true}'::jsonb,
 '{"avatar": {"label": "Profile Picture", "button": "Upload Photo"}}'::jsonb,
 '[{"id": "details", "label": "Details"}, {"id": "roles", "label": "Roles"}]'::jsonb)
ON CONFLICT (entity_type) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    display_name_plural = EXCLUDED.display_name_plural,
    url_path = EXCLUDED.url_path,
    features = EXCLUDED.features,
    labels = EXCLUDED.labels,
    tabs = EXCLUDED.tabs,
    updated_at = NOW();
