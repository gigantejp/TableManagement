-- =====================================================
-- FIX ACCOUNT VIEW - Disable RLS for demo
-- =====================================================
-- Este script deshabilita completamente RLS en las tablas
-- necesarias para que la vista de cuenta funcione

BEGIN;

-- Deshabilitar RLS en orders
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en order_items
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en table_sessions
ALTER TABLE table_sessions DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en cart_items
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- Opcional: eliminar todas las políticas existentes en orders
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_all_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON orders;

-- Opcional: eliminar todas las políticas existentes en order_items
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_all_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON order_items;

-- Opcional: eliminar todas las políticas existentes en table_sessions
DROP POLICY IF EXISTS "table_sessions_select_policy" ON table_sessions;
DROP POLICY IF EXISTS "table_sessions_all_policy" ON table_sessions;

-- Opcional: eliminar todas las políticas existentes en cart_items
DROP POLICY IF EXISTS "cart_items_select_policy" ON cart_items;
DROP POLICY IF EXISTS "cart_items_all_policy" ON cart_items;

COMMIT;

-- Verificar el estado de RLS
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'order_items', 'table_sessions', 'cart_items')
ORDER BY tablename;
