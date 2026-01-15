-- Rename existing incompatible table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wishlist_items') THEN
        -- Check if it has 'wishlist_id' column. If not, it's the old schema.
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wishlist_items' AND column_name = 'wishlist_id') THEN
            ALTER TABLE public.wishlist_items RENAME TO wishlist_items_backup_20260115;
        END IF;
    END IF;
END
$$;

-- Create user_wishlists table
CREATE TABLE IF NOT EXISTS public.user_wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Wishlist',
    is_default BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(50) DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one default wishlist per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wishlists_default 
ON public.user_wishlists(user_id) 
WHERE is_default = TRUE;

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    wishlist_id UUID NOT NULL REFERENCES public.user_wishlists(id) ON DELETE CASCADE,
    sku_item_id UUID NOT NULL REFERENCES public.sku_items(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    PRIMARY KEY (wishlist_id, sku_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_wishlists_user_id ON public.user_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_sku_item_id ON public.wishlist_items(sku_item_id);
