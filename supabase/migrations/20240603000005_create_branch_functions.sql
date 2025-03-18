-- Create a function to insert branches that bypasses RLS
CREATE OR REPLACE FUNCTION insert_branch(branch_name TEXT, branch_address TEXT, branch_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO branches (name, address, phone, created_at, updated_at)
  VALUES (branch_name, branch_address, branch_phone, NOW(), NOW());
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Create a function to update branches that bypasses RLS
CREATE OR REPLACE FUNCTION update_branch(branch_id UUID, branch_name TEXT, branch_address TEXT, branch_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE branches
  SET name = branch_name,
      address = branch_address,
      phone = branch_phone,
      updated_at = NOW()
  WHERE id = branch_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Create a function to delete branches that bypasses RLS
CREATE OR REPLACE FUNCTION delete_branch(branch_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM branches WHERE id = branch_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
