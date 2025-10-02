-- Add new fields to products table for validation tracking
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS source VARCHAR(32) DEFAULT 'OFF',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS off_raw JSONB,
  ADD COLUMN IF NOT EXISTS confidence VARCHAR(8) DEFAULT 'medium';

-- Add new fields to alternatives table for better tracking
ALTER TABLE alternatives 
  ADD COLUMN IF NOT EXISTS reason_tags TEXT[],
  ADD COLUMN IF NOT EXISTS confidence VARCHAR(8) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS source_urls TEXT[];

-- Create index for fast filtering by confidence and source
CREATE INDEX IF NOT EXISTS idx_products_confidence ON products(confidence);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_verified ON products(verified);