-- =====================================================
-- FIX WAITER_CALLS RLS POLICIES
-- =====================================================
-- This script ensures that waiter_calls table has the correct
-- RLS policies to allow anonymous users (clients) to call waiters

-- Step 1: Enable RLS if not already enabled
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'waiter_calls'
        AND schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON waiter_calls';
    END LOOP;
END $$;

-- Step 3: Create new policies that allow all operations
-- Policy 1: Allow everyone to read waiter calls
CREATE POLICY "waiter_calls_select_all"
  ON waiter_calls
  FOR SELECT
  USING (true);

-- Policy 2: Allow everyone to insert waiter calls (anonymous clients)
CREATE POLICY "waiter_calls_insert_all"
  ON waiter_calls
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Allow everyone to update waiter calls
CREATE POLICY "waiter_calls_update_all"
  ON waiter_calls
  FOR UPDATE
  USING (true);

-- Policy 4: Allow everyone to delete waiter calls
CREATE POLICY "waiter_calls_delete_all"
  ON waiter_calls
  FOR DELETE
  USING (true);

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'waiter_calls'
ORDER BY policyname;
