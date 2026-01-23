-- =====================================================
-- CLEAN ALL VIA COSENZA DATA
-- =====================================================
-- This script removes ALL data for Via Cosenza business
-- while keeping the business record itself
-- Business slug: 'via-cosenza'

BEGIN;

-- Step 1: Delete order items (must be first due to FK constraints)
DELETE FROM order_items
WHERE order_id IN (
    SELECT id FROM orders WHERE business_id = 'via-cosenza'
);

-- Step 2: Delete orders
DELETE FROM orders
WHERE business_id = 'via-cosenza';

-- Step 3: Delete cart items
DELETE FROM cart_items
WHERE session_id IN (
    SELECT id FROM table_sessions WHERE business_id = 'via-cosenza'
);

-- Step 4: Delete table sessions
DELETE FROM table_sessions
WHERE business_id = 'via-cosenza';

-- Step 5: Delete waiter calls
DELETE FROM waiter_calls
WHERE business_id = 'via-cosenza';

-- Step 6: Delete menu items
DELETE FROM menu_items
WHERE business_id = 'via-cosenza';

-- Step 7: Delete categories
DELETE FROM categories
WHERE business_id = 'via-cosenza';

-- Step 8: Delete tables
DELETE FROM tables
WHERE business_id = 'via-cosenza';

-- Step 9: Update business currency
UPDATE businesses
SET currency = 'ARS'
WHERE id = 'via-cosenza';

-- Verify cleanup
SELECT
    'order_items' as table_name,
    COUNT(*) as remaining_records
FROM order_items
WHERE order_id IN (SELECT id FROM orders WHERE business_id = 'via-cosenza')
UNION ALL
SELECT 'orders', COUNT(*) FROM orders WHERE business_id = 'via-cosenza'
UNION ALL
SELECT 'cart_items', COUNT(*) FROM cart_items WHERE session_id IN (SELECT id FROM table_sessions WHERE business_id = 'via-cosenza')
UNION ALL
SELECT 'table_sessions', COUNT(*) FROM table_sessions WHERE business_id = 'via-cosenza'
UNION ALL
SELECT 'waiter_calls', COUNT(*) FROM waiter_calls WHERE business_id = 'via-cosenza'
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items WHERE business_id = 'via-cosenza'
UNION ALL
SELECT 'categories', COUNT(*) FROM categories WHERE business_id = 'via-cosenza'
UNION ALL
SELECT 'tables', COUNT(*) FROM tables WHERE business_id = 'via-cosenza';

COMMIT;
