-- =====================================================
-- OPTIMIZE MENU SCHEMA FOR VIA COSENZA
-- =====================================================
-- This script adds missing fields to support the full menu structure

-- Step 1: Add description field to menu_items
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Add currency field to businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ARS';

-- Step 3: Verify the changes
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('menu_items', 'businesses')
    AND column_name IN ('description', 'currency', 'size', 'unit')
ORDER BY table_name, ordinal_position;
