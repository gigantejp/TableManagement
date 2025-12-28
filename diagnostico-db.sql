-- Script de diagnóstico para verificar el estado de la base de datos
-- Ejecuta esto en Supabase SQL Editor

-- =====================================================
-- PASO 1: Verificar estructura de tabla businesses
-- =====================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
ORDER BY ordinal_position;

-- =====================================================
-- PASO 2: Verificar políticas actuales de businesses
-- =====================================================

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'businesses'
  AND schemaname = 'public';

-- =====================================================
-- PASO 3: Verificar si RLS está habilitado
-- =====================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'businesses';
