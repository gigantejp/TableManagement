-- =====================================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- Eliminar todas las políticas de businesses
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'businesses' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON businesses';
    END LOOP;
END $$;

-- Eliminar todas las políticas de categories
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON categories';
    END LOOP;
END $$;

-- Eliminar todas las políticas de menu_items
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_items' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON menu_items';
    END LOOP;
END $$;

-- Eliminar todas las políticas de tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tables' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tables';
    END LOOP;
END $$;

-- Eliminar todas las políticas de orders
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON orders';
    END LOOP;
END $$;

-- Eliminar todas las políticas de order_items
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'order_items' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON order_items';
    END LOOP;
END $$;

-- Eliminar todas las políticas de waiter_calls
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
-- PASO 2: CREAR NUEVAS POLÍTICAS CORRECTAS
-- =====================================================

-- BUSINESSES: Permitir lectura pública, inserción autenticada, actualización/eliminación solo del propietario
CREATE POLICY "businesses_select_policy"
  ON businesses FOR SELECT
  USING (true);

CREATE POLICY "businesses_insert_policy"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "businesses_update_policy"
  ON businesses FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "businesses_delete_policy"
  ON businesses FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- CATEGORIES: Permitir todo
CREATE POLICY "categories_select_policy"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_all_policy"
  ON categories FOR ALL
  USING (true);

-- MENU_ITEMS: Permitir todo
CREATE POLICY "menu_items_select_policy"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "menu_items_all_policy"
  ON menu_items FOR ALL
  USING (true);

-- TABLES: Permitir todo
CREATE POLICY "tables_select_policy"
  ON tables FOR SELECT
  USING (true);

CREATE POLICY "tables_all_policy"
  ON tables FOR ALL
  USING (true);

-- ORDERS: Permitir todo
CREATE POLICY "orders_select_policy"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "orders_all_policy"
  ON orders FOR ALL
  USING (true);

-- ORDER_ITEMS: Permitir todo
CREATE POLICY "order_items_select_policy"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "order_items_all_policy"
  ON order_items FOR ALL
  USING (true);

-- WAITER_CALLS: Permitir todo
CREATE POLICY "waiter_calls_select_policy"
  ON waiter_calls FOR SELECT
  USING (true);

CREATE POLICY "waiter_calls_all_policy"
  ON waiter_calls FOR ALL
  USING (true);
