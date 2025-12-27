-- Fix RLS policies for registration
-- Execute this SQL in your Supabase SQL Editor

-- =====================================================
-- FIX: Update business INSERT policy to allow registration
-- =====================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Allow users to insert their own business" ON businesses;

-- Create a more permissive policy for INSERT during registration
CREATE POLICY "Allow authenticated users to insert business"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());
