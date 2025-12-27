-- Table Management System - Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BUSINESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  logo_url TEXT,
  tagline TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MENU ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT,
  size TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tables (
  id BIGSERIAL PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Disponible' CHECK (status IN ('Disponible', 'Ocupada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, number)
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  table_id BIGINT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  table_name TEXT NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En preparación', 'Entregado', 'Completado')),
  estimated_time INTEGER,
  start_time BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WAITER CALLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS waiter_calls (
  id BIGSERIAL PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  table_id BIGINT REFERENCES tables(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_categories_business ON categories(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_business ON menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_tables_business ON tables(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_business ON waiter_calls(business_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;

-- Policies for PUBLIC access (since this is a public-facing app)
-- You can modify these later for multi-tenant authentication

-- Businesses: Allow read for everyone, allow insert/update/delete for authenticated users
CREATE POLICY "Allow public read access to businesses" ON businesses
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on businesses" ON businesses
  FOR ALL USING (true);

-- Categories: Allow read for everyone
CREATE POLICY "Allow public read access to categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL USING (true);

-- Menu Items: Allow read for everyone
CREATE POLICY "Allow public read access to menu_items" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on menu_items" ON menu_items
  FOR ALL USING (true);

-- Tables: Allow read for everyone
CREATE POLICY "Allow public read access to tables" ON tables
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on tables" ON tables
  FOR ALL USING (true);

-- Orders: Allow read for everyone
CREATE POLICY "Allow public read access to orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on orders" ON orders
  FOR ALL USING (true);

-- Order Items: Allow read for everyone
CREATE POLICY "Allow public read access to order_items" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on order_items" ON order_items
  FOR ALL USING (true);

-- Waiter Calls: Allow read for everyone
CREATE POLICY "Allow public read access to waiter_calls" ON waiter_calls
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on waiter_calls" ON waiter_calls
  FOR ALL USING (true);

-- =====================================================
-- INITIAL DATA - DEMO BUSINESS
-- =====================================================
INSERT INTO businesses (id, name, logo, logo_url, tagline, description)
VALUES (
  'vanshelatto',
  'Vanshelatto',
  '🍦',
  NULL,
  'Heladería artesanal y cafetería',
  'Los mejores helados artesanales y café de especialidad'
) ON CONFLICT (id) DO NOTHING;

-- Demo Categories
INSERT INTO categories (id, business_id, name)
VALUES
  (1, 'vanshelatto', 'Helados'),
  (2, 'vanshelatto', 'Cafetería'),
  (3, 'vanshelatto', 'Postres'),
  (4, 'vanshelatto', 'Bebidas')
ON CONFLICT (id) DO NOTHING;

-- Demo Menu Items
INSERT INTO menu_items (id, business_id, category_id, name, price, image, size, unit)
VALUES
  (1, 'vanshelatto', 1, 'Helado de Chocolate', 800, '🍫', 'Mediano', 'gramos'),
  (2, 'vanshelatto', 1, 'Helado de Vainilla', 750, '🍦', 'Mediano', 'gramos'),
  (3, 'vanshelatto', 2, 'Café Espresso', 350, '☕', 'Chico', 'ml'),
  (4, 'vanshelatto', 2, 'Cappuccino', 450, '☕', 'Mediano', 'ml'),
  (5, 'vanshelatto', 3, 'Brownie', 600, '🍰', 'Unidad', 'unidad'),
  (6, 'vanshelatto', 4, 'Limonada', 300, '🍋', 'Grande', 'ml')
ON CONFLICT (id) DO NOTHING;

-- Demo Tables
INSERT INTO tables (id, business_id, number, name, status)
VALUES
  (1, 'vanshelatto', 1, 'Mesa 1', 'Disponible'),
  (2, 'vanshelatto', 2, 'Mesa 2', 'Disponible'),
  (3, 'vanshelatto', 3, 'Mesa 3', 'Disponible'),
  (4, 'vanshelatto', 4, 'Mesa 4', 'Disponible')
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to continue from the demo data
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));
SELECT setval('tables_id_seq', (SELECT MAX(id) FROM tables));
