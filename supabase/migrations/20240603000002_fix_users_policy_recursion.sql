-- Drop any problematic policies on the users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Public access" ON users;

-- Create a simple policy that doesn't cause recursion
CREATE POLICY "Public access"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Fix the branches table policies if needed
DROP POLICY IF EXISTS "Branch access" ON branches;

CREATE POLICY "Branch access"
ON branches FOR ALL
USING (true);