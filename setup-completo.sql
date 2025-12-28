-- =====================================================
-- SETUP COMPLETO - EJECUTAR ESTE SCRIPT ÚNICO
-- =====================================================

-- =====================================================
-- 1. CREAR TABLA DE TIPOS DE NEGOCIO
-- =====================================================
CREATE TABLE IF NOT EXISTS business_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO business_types (name, slug, description, icon)
VALUES
  ('Heladería', 'heladeria', 'Heladería artesanal', '🍦'),
  ('Pizzería', 'pizzeria', 'Pizzería y comida italiana', '🍕'),
  ('Restaurante', 'restaurante', 'Restaurante de comida general', '🍽️'),
  ('Cafetería', 'cafeteria', 'Cafetería y panadería', '☕'),
  ('Bar', 'bar', 'Bar y bebidas', '🍺')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. AGREGAR COLUMNAS A BUSINESSES
-- =====================================================
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS business_type_id INTEGER REFERENCES business_types(id),
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Hacer slug único solo si no lo es ya
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_slug_key'
  ) THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_slug_key UNIQUE (slug);
  END IF;
END $$;

-- =====================================================
-- 3. LIMPIAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- Businesses
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'businesses' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON businesses';
    END LOOP;
END $$;

-- Categories
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON categories';
    END LOOP;
END $$;

-- Menu Items
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_items' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON menu_items';
    END LOOP;
END $$;

-- Tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tables' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tables';
    END LOOP;
END $$;

-- Orders
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON orders';
    END LOOP;
END $$;

-- Order Items
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'order_items' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON order_items';
    END LOOP;
END $$;

-- Waiter Calls
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'waiter_calls' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON waiter_calls';
    END LOOP;
END $$;

-- =====================================================
-- 4. CREAR POLÍTICAS CORRECTAS PARA REGISTRO
-- =====================================================

-- BUSINESSES
CREATE POLICY "businesses_public_read"
  ON businesses FOR SELECT
  USING (true);

CREATE POLICY "businesses_authenticated_insert"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Permitir inserción durante registro

CREATE POLICY "businesses_owner_update"
  ON businesses FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "businesses_owner_delete"
  ON businesses FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- CATEGORIES
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_all_operations"
  ON categories FOR ALL
  USING (true);

-- MENU_ITEMS
CREATE POLICY "menu_items_public_read"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "menu_items_all_operations"
  ON menu_items FOR ALL
  USING (true);

-- TABLES
CREATE POLICY "tables_public_read"
  ON tables FOR SELECT
  USING (true);

CREATE POLICY "tables_all_operations"
  ON tables FOR ALL
  USING (true);

-- ORDERS
CREATE POLICY "orders_public_read"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "orders_all_operations"
  ON orders FOR ALL
  USING (true);

-- ORDER_ITEMS
CREATE POLICY "order_items_public_read"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "order_items_all_operations"
  ON order_items FOR ALL
  USING (true);

-- WAITER_CALLS
CREATE POLICY "waiter_calls_public_read"
  ON waiter_calls FOR SELECT
  USING (true);

CREATE POLICY "waiter_calls_all_operations"
  ON waiter_calls FOR ALL
  USING (true);

-- BUSINESS_TYPES
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_types_public_read"
  ON business_types FOR SELECT
  USING (true);

-- =====================================================
-- 5. FUNCIONES HELPER
-- =====================================================

CREATE OR REPLACE FUNCTION generate_business_slug(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

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

-- =====================================================
-- 6. ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(business_type_id);

-- =====================================================
-- FIN DEL SETUP
-- =====================================================
