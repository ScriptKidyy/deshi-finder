-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  country_of_origin TEXT NOT NULL,
  is_indian BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  availability TEXT NOT NULL,
  where_to_buy JSONB DEFAULT '[]'::jsonb,
  rating DECIMAL(2, 1) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create alternatives table
CREATE TABLE IF NOT EXISTS public.alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  indian_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  reason TEXT NOT NULL,
  price_comparison TEXT NOT NULL CHECK (price_comparison IN ('cheaper', 'similar', 'more_expensive')),
  quality_comparison TEXT NOT NULL CHECK (quality_comparison IN ('better', 'similar', 'good')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_is_indian ON public.products(is_indian);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_alternatives_original ON public.alternatives(original_product_id);
CREATE INDEX IF NOT EXISTS idx_alternatives_indian ON public.alternatives(indian_product_id);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternatives ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Allow public read access for all products
CREATE POLICY "Allow public read access to products"
  ON public.products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to alternatives"
  ON public.alternatives FOR SELECT
  TO public
  USING (true);

-- Allow public insert/update for products (for AI-generated products)
CREATE POLICY "Allow public insert to products"
  ON public.products FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to products"
  ON public.products FOR UPDATE
  TO public
  USING (true);

-- Allow public insert for alternatives (for AI-generated alternatives)
CREATE POLICY "Allow public insert to alternatives"
  ON public.alternatives FOR INSERT
  TO public
  WITH CHECK (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();