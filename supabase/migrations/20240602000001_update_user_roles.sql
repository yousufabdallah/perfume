-- Update user_role enum to match our application roles
ALTER TYPE "public"."user_role" RENAME TO "user_role_old";

CREATE TYPE "public"."user_role" AS ENUM ('accountant', 'branch_manager', 'general_manager');

-- Convert existing data
ALTER TABLE "public"."users" 
  ALTER COLUMN "role" TYPE "public"."user_role" USING 
  CASE 
    WHEN "role"::text = 'accountant' THEN 'accountant'::"public"."user_role"
    WHEN "role"::text = 'branch_manager' THEN 'branch_manager'::"public"."user_role"
    ELSE 'general_manager'::"public"."user_role"
  END;

-- Drop old type
DROP TYPE "public"."user_role_old";

-- Create RLS policies for user data protection
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own data
DROP POLICY IF EXISTS "Users can view own data" ON "public"."users";
CREATE POLICY "Users can view own data"
ON "public"."users"
FOR SELECT
USING (auth.uid() = id);

-- Policy for general managers to see all users
DROP POLICY IF EXISTS "General managers can view all users" ON "public"."users";
CREATE POLICY "General managers can view all users"
ON "public"."users"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'general_manager'::user_role
  )
);

-- Policy for branch managers to see users in their branch
DROP POLICY IF EXISTS "Branch managers can view branch users" ON "public"."users";
CREATE POLICY "Branch managers can view branch users"
ON "public"."users"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'branch_manager'::user_role
    AND users.branch_id = "public"."users".branch_id
  )
);

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role;
END;
$$;
