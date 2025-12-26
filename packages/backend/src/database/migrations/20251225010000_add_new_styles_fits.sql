-- Create 'style' attribute type if it doesn't exist
INSERT INTO vufs_attribute_types (slug, name) VALUES 
('style', 'Style')
ON CONFLICT (slug) DO NOTHING;

-- Add new Style values to vufs_attribute_values
INSERT INTO vufs_attribute_values (type_slug, name) VALUES 
('style', 'Activewear'),
('style', 'Athleisure'),
('style', 'Basic'),
('style', 'Cargo'),
('style', 'Carpenter'),
('style', 'Merch'),
('style', 'Pilot'),
('style', 'Reversible'),
('style', 'RP'),
('style', 'Stoned'),
('style', 'Thrashed'),
('style', 'Vintage')
ON CONFLICT (type_slug, name) DO NOTHING;

-- Add new Fit values to vufs_fits
INSERT INTO vufs_fits (name) VALUES 
('Adjustable Fit'),
('Baggy'),
('Bootcut'),
('Boxy'),
('Compression'),
('Cropped'),
('Flare'),
('Straight'),
('Stretch'),
('Wide')
ON CONFLICT (name) DO NOTHING;
