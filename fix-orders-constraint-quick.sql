-- FIX RÁPIDO: Eliminar constraint de status en orders
-- Esto permite cualquier valor en el campo status

BEGIN;

-- Eliminar el constraint que causa problemas
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Verificar que se eliminó
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'orders';

COMMIT;

-- Ahora la tabla orders aceptará cualquier status sin restricciones
