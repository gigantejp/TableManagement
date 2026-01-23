-- =====================================================
-- VIA COSENZA COMPLETE MENU SETUP
-- =====================================================
-- This master script:
-- 1. Optimizes the database schema
-- 2. Cleans all existing Via Cosenza data
-- 3. Loads the complete new menu
--
-- Business: Via Cosenza (slug: via-cosenza)
-- Currency: ARS (Argentine Pesos)
-- Total Items: 39 menu items across 6 categories
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: OPTIMIZE SCHEMA
-- =====================================================

-- Add description field to menu_items
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add currency field to businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ARS';

-- =====================================================
-- STEP 2: CLEAN EXISTING VIA COSENZA DATA
-- =====================================================

-- Delete order items (must be first due to FK constraints)
DELETE FROM order_items
WHERE order_id IN (
    SELECT id FROM orders WHERE business_id = 'via-cosenza'
);

-- Delete orders
DELETE FROM orders
WHERE business_id = 'via-cosenza';

-- Delete cart items
DELETE FROM cart_items
WHERE session_id IN (
    SELECT id FROM table_sessions WHERE business_id = 'via-cosenza'
);

-- Delete table sessions
DELETE FROM table_sessions
WHERE business_id = 'via-cosenza';

-- Delete waiter calls
DELETE FROM waiter_calls
WHERE business_id = 'via-cosenza';

-- Delete menu items
DELETE FROM menu_items
WHERE business_id = 'via-cosenza';

-- Delete categories
DELETE FROM categories
WHERE business_id = 'via-cosenza';

-- Delete tables
DELETE FROM tables
WHERE business_id = 'via-cosenza';

-- Update business currency
UPDATE businesses
SET currency = 'ARS'
WHERE id = 'via-cosenza';

-- =====================================================
-- STEP 3: CREATE CATEGORIES
-- =====================================================

INSERT INTO categories (business_id, name) VALUES
('via-cosenza', 'Cafecito'),
('via-cosenza', 'Tés & Chocolates'),
('via-cosenza', 'Dolce'),
('via-cosenza', 'Copas Heladas'),
('via-cosenza', 'Salato'),
('via-cosenza', 'Refresh');

-- =====================================================
-- STEP 4: LOAD MENU ITEMS
-- =====================================================

-- Category: Cafecito (15 items)
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Ristretto', 2900, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Espresso', 3700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Espresso Lungo', 4700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Espresso Doppio', 4700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Lágrima Latte', 3700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Macchiato Lungo', 4700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Caffé Latte', 6800, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Cappuccino', 3900, 'Chico', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Cappuccino', 4000, 'Grande', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Espresso Tiramisú', 4900, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Marrocchino', 4700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Affogato', 4900, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Caffé Cosenza', 5600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Caffé Irlandés', 5800, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Caffé Calipso', 2900, NULL, NULL);

-- Category: Tés & Chocolates (5 items)
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Té clásico', 2900, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Té saborizado', 3700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Chocolatada', 4700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Submarino', 4700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Chocolate caliente', 3700, NULL, NULL);

-- Category: Dolce (7 items)
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Tiramisú', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Cheesecake', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Selva Negra', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Brownie', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Crumble de Manzana', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Chocotorta', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Lemon Pie', 7600, NULL, NULL);

-- Category: Copas Heladas (3 items)
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Banana Split', 9000, NULL, 'Helado de chocolate, dulce de leche y banana con crema chantilly, nueces y salsas'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Primavera', 9300, NULL, 'Helado de crema americana y frutilla, frutas de estación y salsa de frutillas'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Alpina', 8800, NULL, 'Helado de chocolate y chocolate blanco con crema chantilly');

-- Category: Salato (2 items)
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Salato'), 'Ciabatta Clásica', 8700, NULL, 'Jamón cocido y queso'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Salato'), 'Ciabatta Caprese', 10000, NULL, 'Jamón crudo, bocconcinos, tomates secos y albahaca');

-- Category: Refresh (4 items)
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Milkshake', 6200, NULL, 'Helado a elección con leche'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Berry Frappé', 6600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Smoothie de Frutilla', 5600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Limonada de menta, limón y jengibre', 4500, NULL, NULL);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Summary
SELECT
    'Categories' as type,
    COUNT(*) as count
FROM categories
WHERE business_id = 'via-cosenza'
UNION ALL
SELECT
    'Menu Items' as type,
    COUNT(*) as count
FROM menu_items
WHERE business_id = 'via-cosenza';

-- Detailed view
SELECT
    c.name as category,
    COUNT(m.id) as items_count,
    MIN(m.price) as min_price,
    MAX(m.price) as max_price
FROM categories c
LEFT JOIN menu_items m ON c.id = m.category_id
WHERE c.business_id = 'via-cosenza'
GROUP BY c.name
ORDER BY c.name;

COMMIT;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Via Cosenza menu has been completely reloaded
-- Execute this script in Supabase SQL Editor
-- =====================================================
