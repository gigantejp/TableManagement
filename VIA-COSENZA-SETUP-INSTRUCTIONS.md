# Via Cosenza - Complete Menu Setup Instructions

## Overview

This guide will help you completely replace the Via Cosenza menu with the new comprehensive menu structure including 39 items across 6 categories.

## What Will Happen

1. ✅ **Database schema will be optimized** to support item descriptions and variants
2. ✅ **All existing Via Cosenza data will be deleted** (categories, menu items, orders, etc.)
3. ✅ **New menu will be loaded** with 6 categories and 39 items
4. ✅ **Frontend is already updated** to display sizes and descriptions

## New Menu Structure

### Categories & Items

1. **Cafecito** (15 items)
   - Ristretto, Espresso, Espresso Lungo, Espresso Doppio
   - Lágrima Latte, Macchiato Lungo, Caffé Latte
   - **Cappuccino** (2 variants: Chico $3900, Grande $4000)
   - Espresso Tiramisú, Marrocchino, Affogato
   - Caffé Cosenza, Caffé Irlandés, Caffé Calipso

2. **Tés & Chocolates** (5 items)
   - Té clásico, Té saborizado
   - Chocolatada, Submarino, Chocolate caliente

3. **Dolce** (7 items)
   - Tiramisú, Cheesecake, Selva Negra
   - Brownie, Crumble de Manzana, Chocotorta, Lemon Pie

4. **Copas Heladas** (3 items with descriptions)
   - Banana Split: "Helado de chocolate, dulce de leche y banana con crema chantilly, nueces y salsas"
   - Primavera: "Helado de crema americana y frutilla, frutas de estación y salsa de frutillas"
   - Alpina: "Helado de chocolate y chocolate blanco con crema chantilly"

5. **Salato** (2 items with descriptions)
   - Ciabatta Clásica: "Jamón cocido y queso"
   - Ciabatta Caprese: "Jamón crudo, bocconcinos, tomates secos y albahaca"

6. **Refresh** (4 items)
   - Milkshake: "Helado a elección con leche"
   - Berry Frappé, Smoothie de Frutilla
   - Limonada de menta, limón y jengibre

**Currency:** ARS (Argentine Pesos)

---

## Step-by-Step Setup

### Step 1: Run the SQL Script in Supabase

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the **ENTIRE** content from `via-cosenza-complete-setup.sql`
6. Paste it into the SQL Editor
7. Click **Run** or press `Ctrl + Enter`

**Expected Result:**
```
Success. Rows returned: 2

type          | count
------------- | -----
Categories    | 6
Menu Items    | 39
```

You'll also see a detailed breakdown showing item counts and price ranges per category.

### Step 2: Verify the Data

Still in Supabase SQL Editor, run this verification query:

```sql
-- Verify the menu was loaded correctly
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
```

You should see all 39 items organized by category.

### Step 3: Clear Your Browser Cache

The frontend has already been deployed with the new display logic, but you need to clear your cache:

#### On Desktop Chrome/Firefox:
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Click "Clear data"

#### On Mobile Safari (iOS):
- Settings → Safari → Clear History and Website Data

#### On Mobile Chrome (Android):
- Chrome Settings → Privacy → Clear browsing data → Cached images and files

### Step 4: Test the New Menu

1. Open the Via Cosenza menu page: `https://gigantejp.github.io/TableManagement/via-cosenza/table/1`

2. **Verify these features:**
   - ✅ See all 6 categories
   - ✅ See "Cappuccino (Chico)" and "Cappuccino (Grande)" as separate items
   - ✅ See descriptions for Copas Heladas and Salato items
   - ✅ All prices display correctly in ARS
   - ✅ Can add items to cart
   - ✅ Cart shows the correct variant (e.g., "Cappuccino (Chico)")

---

## What Changed in the Database

### New Fields Added:

1. **menu_items table:**
   - `description` (TEXT) - Stores item descriptions
   - Now properly uses existing `size` field for variants

2. **businesses table:**
   - `currency` (VARCHAR(3)) - Stores currency code (default: ARS)

### How Variants Work:

Items with multiple sizes (like Cappuccino) are stored as separate records:

```sql
-- Cappuccino Chico
INSERT INTO menu_items (..., name, price, size) VALUES
('via-cosenza', ..., 'Cappuccino', 3900, 'Chico');

-- Cappuccino Grande
INSERT INTO menu_items (..., name, price, size) VALUES
('via-cosenza', ..., 'Cappuccino', 4000, 'Grande');
```

The frontend displays them as: **"Cappuccino (Chico)"** and **"Cappuccino (Grande)"**

---

## Troubleshooting

### Issue: "Column 'description' does not exist"

**Solution:** The schema migration didn't run. Execute just this part first:

```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ARS';
```

### Issue: Menu still shows old items

**Solution:**
1. The cleanup script may not have run. Check with:
   ```sql
   SELECT COUNT(*) FROM menu_items WHERE business_id = 'via-cosenza';
   ```
2. If it shows old items, run `clean-via-cosenza-data.sql` first, then `load-via-cosenza-menu.sql`

### Issue: Frontend doesn't show sizes or descriptions

**Solution:**
1. Wait 2-3 minutes for GitHub Actions to finish deploying
2. Clear your browser cache completely
3. Check the deployment status at: https://github.com/gigantejp/TableManagement/actions

### Issue: Images/emojis not showing

**Solution:**
The current items don't have images assigned. You can add them later through the admin panel or by updating the database:

```sql
UPDATE menu_items
SET image = '☕'
WHERE name LIKE '%Café%' OR name LIKE '%Espresso%';
```

---

## Files Reference

- **`via-cosenza-complete-setup.sql`** - Master script (run this one)
- **`optimize-menu-schema.sql`** - Schema changes only
- **`clean-via-cosenza-data.sql`** - Data cleanup only
- **`load-via-cosenza-menu.sql`** - Menu data only

---

## Next Steps

After the menu is loaded:

1. **Add images/emojis** to items through the admin panel
2. **Create tables** for Via Cosenza (Mesa 1, Mesa 2, etc.)
3. **Test the complete flow**:
   - Scan QR code → View menu → Add to cart → Place order
4. **Configure the business logo** (once Supabase Storage is set up)

---

## Support

If you encounter any issues:
1. Check the Supabase SQL Editor for error messages
2. Verify you're using the correct business slug: `via-cosenza`
3. Ensure the business exists in the `businesses` table
4. Check the GitHub Actions deployment completed successfully

---

**Last Updated:** 2024-12-29
**Menu Items:** 39
**Categories:** 6
**Currency:** ARS
