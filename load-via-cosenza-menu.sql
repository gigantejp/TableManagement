-- =====================================================
-- LOAD VIA COSENZA COMPLETE MENU
-- =====================================================
-- This script loads the complete menu for Via Cosenza
-- Currency: ARS (Argentine Pesos)

BEGIN;

-- =====================================================
-- CATEGORIES
-- =====================================================

INSERT INTO categories (business_id, name) VALUES
('via-cosenza', 'Cafecito'),
('via-cosenza', 'Tés & Chocolates'),
('via-cosenza', 'Dolce'),
('via-cosenza', 'Copas Heladas'),
('via-cosenza', 'Salato'),
('via-cosenza', 'Refresh')
ON CONFLICT DO NOTHING;

-- =====================================================
-- MENU ITEMS
-- =====================================================

-- Category: Cafecito
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

-- Category: Tés & Chocolates
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Té clásico', 2900, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Té saborizado', 3700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Chocolatada', 4700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Submarino', 4700, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Chocolate caliente', 3700, NULL, NULL);

-- Category: Dolce
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Tiramisú', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Cheesecake', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Selva Negra', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Brownie', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Crumble de Manzana', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Chocotorta', 7600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce'), 'Lemon Pie', 7600, NULL, NULL);

-- Category: Copas Heladas
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Banana Split', 9000, NULL, 'Helado de chocolate, dulce de leche y banana con crema chantilly, nueces y salsas'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Primavera', 9300, NULL, 'Helado de crema americana y frutilla, frutas de estación y salsa de frutillas'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Alpina', 8800, NULL, 'Helado de chocolate y chocolate blanco con crema chantilly');

-- Category: Salato
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Salato'), 'Ciabatta Clásica', 8700, NULL, 'Jamón cocido y queso'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Salato'), 'Ciabatta Caprese', 10000, NULL, 'Jamón crudo, bocconcinos, tomates secos y albahaca');

-- Category: Refresh
INSERT INTO menu_items (business_id, category_id, name, price, size, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Milkshake', 6200, NULL, 'Helado a elección con leche'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Berry Frappé', 6600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Smoothie de Frutilla', 5600, NULL, NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Limonada de menta, limón y jengibre', 4500, NULL, NULL);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify categories
SELECT
    'Categories' as type,
    COUNT(*) as count
FROM categories
WHERE business_id = 'via-cosenza'
UNION ALL
-- Verify menu items
SELECT
    'Menu Items' as type,
    COUNT(*) as count
FROM menu_items
WHERE business_id = 'via-cosenza';

-- Show all items by category
SELECT
    c.name as category,
    m.name as item,
    m.size,
    m.price,
    m.description
FROM menu_items m
JOIN categories c ON m.category_id = c.id
WHERE m.business_id = 'via-cosenza'
ORDER BY c.name, m.name, m.size;

COMMIT;
