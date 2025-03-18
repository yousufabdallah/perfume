-- Completely disable RLS for branches table to simplify access
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on branches table
DROP POLICY IF EXISTS "Enable read access for all users" ON branches;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON branches;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON branches;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON branches;
