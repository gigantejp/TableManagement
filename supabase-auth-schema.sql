-- Authentication and Business Types Update
-- Execute this SQL in your Supabase SQL Editor

-- =====================================================
-- BUSINESS TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS business_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- emoji or icon name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial business types
INSERT INTO business_types (name, slug, description, icon)
VALUES
  ('Heladería', 'heladeria', 'Heladería artesanal', '🍦'),
  ('Pizzería', 'pizzeria', 'Pizzería y comida italiana', '🍕'),
  ('Restaurante', 'restaurante', 'Restaurante de comida general', '🍽️'),
  ('Cafetería', 'cafeteria', 'Cafetería y panadería', '☕'),
  ('Bar', 'bar', 'Bar y bebidas', '🍺')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- UPDATE BUSINESSES TABLE
-- =====================================================

-- Add new columns to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS business_type_id INTEGER REFERENCES business_types(id),
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing business to have business type
UPDATE businesses
SET
  business_type_id = (SELECT id FROM business_types WHERE slug = 'heladeria'),
  slug = 'vanshelatto',
  is_active = true
WHERE id = 'vanshelatto';

-- =====================================================
-- UPDATE RLS POLICIES FOR BUSINESSES
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Allow public read access to businesses" ON businesses;
DROP POLICY IF EXISTS "Allow all operations on businesses" ON businesses;

-- New policies with authentication
CREATE POLICY "Allow public read access to active businesses"
  ON businesses FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow users to insert their own business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Allow users to update their own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Allow users to delete their own business"
  ON businesses FOR DELETE
  USING (auth.uid() = owner_user_id);

-- =====================================================
-- UPDATE RLS POLICIES FOR RELATED TABLES
-- =====================================================

-- Categories
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;

CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Allow business owners to manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = categories.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- Menu Items
DROP POLICY IF EXISTS "Allow public read access to menu_items" ON menu_items;
DROP POLICY IF EXISTS "Allow all operations on menu_items" ON menu_items;

CREATE POLICY "Allow public read access to menu_items"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "Allow business owners to manage menu_items"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = menu_items.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- Tables
DROP POLICY IF EXISTS "Allow public read access to tables" ON tables;
DROP POLICY IF EXISTS "Allow all operations on tables" ON tables;

CREATE POLICY "Allow public read access to tables"
  ON tables FOR SELECT
  USING (true);

CREATE POLICY "Allow business owners to manage tables"
  ON tables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = tables.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- Orders
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;

CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Allow business owners and clients to manage orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = orders.business_id
      AND (businesses.owner_user_id = auth.uid() OR auth.uid() IS NULL)
    )
    OR auth.uid() IS NULL  -- Allow anonymous clients to create orders
  );

-- Order Items
DROP POLICY IF EXISTS "Allow public read access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow all operations on order_items" ON order_items;

CREATE POLICY "Allow public read access to order_items"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Allow order-related access to order_items"
  ON order_items FOR ALL
  USING (true);  -- Managed through orders table

-- Waiter Calls
DROP POLICY IF EXISTS "Allow public read access to waiter_calls" ON waiter_calls;
DROP POLICY IF EXISTS "Allow all operations on waiter_calls" ON waiter_calls;

CREATE POLICY "Allow public read access to waiter_calls"
  ON waiter_calls FOR SELECT
  USING (true);

CREATE POLICY "Allow clients and business owners to manage waiter_calls"
  ON waiter_calls FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = waiter_calls.business_id
      AND (businesses.owner_user_id = auth.uid() OR auth.uid() IS NULL)
    )
    OR auth.uid() IS NULL  -- Allow anonymous clients to call waiter
  );

-- =====================================================
-- ENABLE RLS ON BUSINESS_TYPES
-- =====================================================
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to business_types"
  ON business_types FOR SELECT
  USING (true);

-- =====================================================
-- CREATE INDEX FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(business_type_id);

-- =====================================================
-- HELPER FUNCTION: Generate Business Slug
-- =====================================================
CREATE OR REPLACE FUNCTION generate_business_slug(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  -- Check if slug exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER FUNCTION: Get User Business
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_business(user_id UUID)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  logo TEXT,
  logo_url TEXT,
  tagline TEXT,
  description TEXT,
  business_type_id INTEGER,
  slug TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.logo,
    b.logo_url,
    b.tagline,
    b.description,
    b.business_type_id,
    b.slug,
    b.is_active
  FROM businesses b
  WHERE b.owner_user_id = user_id
  AND b.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
