-- Fix ALL RLS policies for the application
-- Execute this SQL in your Supabase SQL Editor

-- =====================================================
-- FIX: BUSINESSES TABLE POLICIES
-- =====================================================

-- Drop ALL existing policies on businesses
DROP POLICY IF EXISTS "Allow public read access to businesses" ON businesses;
DROP POLICY IF EXISTS "Allow all operations on businesses" ON businesses;
DROP POLICY IF EXISTS "Allow users to insert their own business" ON businesses;
DROP POLICY IF EXISTS "Allow authenticated users to insert business" ON businesses;
DROP POLICY IF EXISTS "Users can read their own business" ON businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON businesses;

-- Create comprehensive policies for businesses
CREATE POLICY "Allow public read businesses"
  ON businesses FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users update own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Allow users delete own businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- =====================================================
-- VERIFY OTHER TABLES HAVE CORRECT POLICIES
-- =====================================================

-- Categories: Allow all for now (can be restricted later)
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;

CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "All operations categories" ON categories
  FOR ALL USING (true);

-- Menu Items: Allow all for now
DROP POLICY IF EXISTS "Allow public read access to menu_items" ON menu_items;
DROP POLICY IF EXISTS "Allow all operations on menu_items" ON menu_items;

CREATE POLICY "Public read menu_items" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "All operations menu_items" ON menu_items
  FOR ALL USING (true);

-- Tables: Allow all for now
DROP POLICY IF EXISTS "Allow public read access to tables" ON tables;
DROP POLICY IF EXISTS "Allow all operations on tables" ON tables;

CREATE POLICY "Public read tables" ON tables
  FOR SELECT USING (true);

CREATE POLICY "All operations tables" ON tables
  FOR ALL USING (true);

-- Orders: Allow all for now
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;

CREATE POLICY "Public read orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "All operations orders" ON orders
  FOR ALL USING (true);

-- Order Items: Allow all for now
DROP POLICY IF EXISTS "Allow public read access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow all operations on order_items" ON order_items;

CREATE POLICY "Public read order_items" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "All operations order_items" ON order_items
  FOR ALL USING (true);

-- Waiter Calls: Allow all for now
DROP POLICY IF EXISTS "Allow public read access to waiter_calls" ON waiter_calls;
DROP POLICY IF EXISTS "Allow all operations on waiter_calls" ON waiter_calls;

CREATE POLICY "Public read waiter_calls" ON waiter_calls
  FOR SELECT USING (true);

CREATE POLICY "All operations waiter_calls" ON waiter_calls
  FOR ALL USING (true);

-- Table Sessions: Allow all for now
DROP POLICY IF EXISTS "Allow public read access to table_sessions" ON table_sessions;
DROP POLICY IF EXISTS "Allow all operations on table_sessions" ON table_sessions;

CREATE POLICY "Public read table_sessions" ON table_sessions
  FOR SELECT USING (true);

CREATE POLICY "All operations table_sessions" ON table_sessions
  FOR ALL USING (true);

-- Cart Items: Allow all for now
DROP POLICY IF EXISTS "Allow public read access to cart_items" ON cart_items;
DROP POLICY IF EXISTS "Allow all operations on cart_items" ON cart_items;

CREATE POLICY "Public read cart_items" ON cart_items
  FOR SELECT USING (true);

CREATE POLICY "All operations cart_items" ON cart_items
  FOR ALL USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all policies to verify
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
