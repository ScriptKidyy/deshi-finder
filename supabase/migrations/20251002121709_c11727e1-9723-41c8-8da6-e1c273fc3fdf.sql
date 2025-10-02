-- Clear all seed data from database tables
-- Delete alternatives first (references products)
DELETE FROM public.alternatives;

-- Delete all products
DELETE FROM public.products;
