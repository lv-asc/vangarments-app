-- Seed Sizes
INSERT INTO vufs_sizes (name, sort_order) VALUES 
('XS', 1),
('S', 2),
('M', 3),
('L', 4),
('XL', 5),
('XXL', 6)
ON CONFLICT (name) DO NOTHING;

-- Seed Fits
INSERT INTO vufs_fits (name) VALUES 
('Slim'),
('Regular'),
('Relaxed'),
('Oversized'),
('Skinny'),
('Loose')
ON CONFLICT (name) DO NOTHING;
