-- Drop existing policies on branches table
DROP POLICY IF EXISTS "Enable read access for all users" ON branches;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON branches;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON branches;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON branches;

-- Create simplified policies without user role checks
CREATE POLICY "Enable read access for all users"
ON branches FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON branches FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users"
ON branches FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users"
ON branches FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Make sure RLS is enabled on branches table
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
