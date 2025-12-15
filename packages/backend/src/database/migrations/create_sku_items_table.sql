CREATE TABLE IF NOT EXISTS sku_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  collection VARCHAR(100),
  line VARCHAR(100),
  category JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  materials TEXT[],
  images JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_sku_items_brand_id ON sku_items(brand_id);
CREATE INDEX idx_sku_items_code ON sku_items(code);

-- Add sku_item_id to vufs_items
ALTER TABLE vufs_items 
ADD COLUMN IF NOT EXISTS sku_item_id UUID REFERENCES sku_items(id) ON DELETE SET NULL;

CREATE INDEX idx_vufs_items_sku_item_id ON vufs_items(sku_item_id);
