-- Add featured flag and timestamp for product features
ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN featured_at TEXT;
ALTER TABLE products ADD COLUMN featured_priority INTEGER DEFAULT 0;
