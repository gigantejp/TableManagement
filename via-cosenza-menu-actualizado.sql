-- =====================================================
-- VIA COSENZA - MENU ACTUALIZADO SEGÚN MENÚ FÍSICO
-- =====================================================
-- Este script carga el menú exacto según las imágenes del menú físico
-- Incluye precios correctos y estructura real del negocio

BEGIN;

-- =====================================================
-- PASO 1: LIMPIAR DATOS EXISTENTES
-- =====================================================

DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE business_id = 'via-cosenza');
DELETE FROM orders WHERE business_id = 'via-cosenza';
DELETE FROM cart_items WHERE session_id IN (SELECT id FROM table_sessions WHERE business_id = 'via-cosenza');
DELETE FROM table_sessions WHERE business_id = 'via-cosenza';
DELETE FROM waiter_calls WHERE business_id = 'via-cosenza';
DELETE FROM menu_items WHERE business_id = 'via-cosenza';
DELETE FROM categories WHERE business_id = 'via-cosenza';

UPDATE businesses SET currency = 'ARS' WHERE id = 'via-cosenza';

-- =====================================================
-- PASO 2: CREAR CATEGORÍAS
-- =====================================================

INSERT INTO categories (business_id, name) VALUES
('via-cosenza', 'Cafecito'),
('via-cosenza', 'Especiales'),
('via-cosenza', 'Tés & Chocolates'),
('via-cosenza', 'Agrega'),
('via-cosenza', 'Dolce - Tartines'),
('via-cosenza', 'Bocados'),
('via-cosenza', 'Copas Heladas'),
('via-cosenza', 'Salato'),
('via-cosenza', 'Refresh');

-- =====================================================
-- PASO 3: CARGAR ITEMS DEL MENÚ
-- =====================================================

-- CAFECITO
INSERT INTO menu_items (business_id, category_id, name, price, image, size) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Ristretto', 2900, '☕', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Espresso', 2900, '☕', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Espresso Lungo', 3700, '☕', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Espresso Doppio', 4700, '☕', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Lágrima Latte', 4700, '☕', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Macchiato Lungo', 3700, '☕', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Caffé Latte', 4700, '☕', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Cappuccino', 5600, '☕', 'chico'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Cafecito'), 'Cappuccino', 5800, '☕', 'grande');

-- ESPECIALES ($6800 cada uno)
INSERT INTO menu_items (business_id, category_id, name, price, image) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Especiales'), 'Espresso Tiramisú', 6800, '☕'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Especiales'), 'Marrocchino', 6800, '☕'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Especiales'), 'Affogato', 6800, '☕'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Especiales'), 'Caffé Cosenza', 6800, '☕'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Especiales'), 'Caffé Irlandés', 6800, '☕'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Especiales'), 'Caffé Calipso', 6800, '☕');

-- TÉS & CHOCOLATES
INSERT INTO menu_items (business_id, category_id, name, price, image) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Té clásico', 3900, '🍵'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Té saborizado', 4000, '🍵'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Chocolatada', 4700, '🍫'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Submarino', 4900, '🍫'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Tés & Chocolates'), 'Chocolate caliente', 4900, '🍫');

-- AGREGA
INSERT INTO menu_items (business_id, category_id, name, price, image) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Agrega'), 'Leche', 400, '🥛'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Agrega'), 'Leche de almendras', 650, '🥛');

-- DOLCE - TARTINES ($7600 todas)
INSERT INTO menu_items (business_id, category_id, name, price, image, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Tiramisú', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Lemon Pie', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Cheesecake', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Cabsha', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Selva Negra', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Chajá', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Brownie', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Pistachos', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Crumble Manzana', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Avellanas', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Chocolate Crujiente', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Colombia', 7600, '🍰', 'Tartine'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Dolce - Tartines'), 'Chocotorta', 7600, '🍰', 'Tartine');

-- BOCADOS
INSERT INTO menu_items (business_id, category_id, name, price, image) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Bocados'), 'Medialuna', 1300, '🥐'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Bocados'), 'Scon', 2700, '🥐'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Bocados'), 'Alfajor de almendras', 2500, '🍪'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Bocados'), 'Alfajor de maicena', 3700, '🍪'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Bocados'), 'Alfajor de coco', 2500, '🍪'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Bocados'), 'Conito de dulce de leche', 1900, '🍦'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Bocados'), 'Cookie', 1950, '🍪'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Bocados'), 'Budín', 2500, '🍰');

-- COPAS HELADAS (mantener las anteriores)
INSERT INTO menu_items (business_id, category_id, name, price, image, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Banana Split', 9000, '🍨', 'Helado de chocolate, dulce de leche y banana con crema chantilly, nueces y salsas'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Primavera', 9300, '🍨', 'Helado de crema americana y frutilla, frutas de estación y salsa de frutillas'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Copas Heladas'), 'Alpina', 8800, '🍨', 'Helado de chocolate y chocolate blanco con crema chantilly');

-- SALATO (mantener las anteriores)
INSERT INTO menu_items (business_id, category_id, name, price, image, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Salato'), 'Ciabatta Clásica', 8700, '🥖', 'Jamón cocido y queso'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Salato'), 'Ciabatta Caprese', 10000, '🥖', 'Jamón crudo, bocconcinos, tomates secos y albahaca');

-- REFRESH (mantener las anteriores)
INSERT INTO menu_items (business_id, category_id, name, price, image, description) VALUES
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Milkshake', 6200, '🥤', 'Helado a elección con leche'),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Berry Frappé', 6600, '🥤', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Smoothie de Frutilla', 5600, '🥤', NULL),
('via-cosenza', (SELECT id FROM categories WHERE business_id = 'via-cosenza' AND name = 'Refresh'), 'Limonada de menta, limón y jengibre', 4500, '🍋', NULL);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT
    'Resumen por Categoría' as info,
    c.name as categoria,
    COUNT(m.id) as items,
    MIN(m.price) as precio_min,
    MAX(m.price) as precio_max
FROM categories c
LEFT JOIN menu_items m ON c.id = m.category_id
WHERE c.business_id = 'via-cosenza'
GROUP BY c.name
ORDER BY c.name;

COMMIT;

-- =====================================================
-- COMPLETADO
-- =====================================================
-- Total aproximado: 60+ items
-- Precios actualizados según menú físico
-- Nuevas categorías: Especiales, Agrega, Bocados
-- Tartines como categoría unificada con precio único
-- =====================================================
