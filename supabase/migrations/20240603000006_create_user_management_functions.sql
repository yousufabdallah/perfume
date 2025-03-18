-- Create a function to check if the current user is a general manager
CREATE OR REPLACE FUNCTION is_general_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = auth.uid();
  RETURN user_role = 'general_manager';
END;
$$;

-- Modify the create_user_with_role function to check if the current user is a general manager
CREATE OR REPLACE FUNCTION create_user_with_role(
  email TEXT,
  password TEXT,
  full_name TEXT,
  user_role TEXT,
  branch_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result JSONB;
BEGIN
  -- Check if the current user is a general manager
  IF NOT is_general_manager() THEN
    RAISE EXCEPTION 'Only general managers can create users';
  END IF;

  -- Validate general manager email
  IF user_role = 'general_manager' AND email != 'yousufabdallah2000@gmail.com' THEN
    RAISE EXCEPTION 'Only yousufabdallah2000@gmail.com can be the general manager';
  END IF;

  -- Check if a general manager already exists when trying to create one
  IF user_role = 'general_manager' THEN
    IF EXISTS (SELECT 1 FROM users WHERE role = 'general_manager') THEN
      RAISE EXCEPTION 'A general manager already exists';
    END IF;
  END IF;

  -- Create the user in auth.users
  INSERT INTO auth.users (email, password, email_confirmed_at, raw_app_meta_data)
  VALUES (
    email,
    password,
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::text[])
  )
  RETURNING id INTO new_user_id;

  -- Create the user in public.users
  INSERT INTO public.users (id, email, full_name, role, branch_id)
  VALUES (new_user_id, email, full_name, user_role, branch_id);

  result := jsonb_build_object(
    'id', new_user_id,
    'email', email,
    'full_name', full_name,
    'role', user_role,
    'branch_id', branch_id
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Create a function to update users that checks if the current user is a general manager
CREATE OR REPLACE FUNCTION update_user_with_role(
  user_id UUID,
  full_name TEXT,
  user_role TEXT,
  branch_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email TEXT;
  current_user_role TEXT;
BEGIN
  -- Check if the current user is a general manager
  IF NOT is_general_manager() THEN
    RAISE EXCEPTION 'Only general managers can update users';
  END IF;

  -- Get the current user's email and role
  SELECT email, role INTO current_user_email, current_user_role FROM users WHERE id = user_id;

  -- Prevent changing role to general manager if email is not the designated one
  IF user_role = 'general_manager' AND current_user_email != 'yousufabdallah2000@gmail.com' THEN
    RAISE EXCEPTION 'Only yousufabdallah2000@gmail.com can be the general manager';
  END IF;

  -- Check if a general manager already exists when trying to change role to general manager
  IF user_role = 'general_manager' AND current_user_role != 'general_manager' THEN
    IF EXISTS (SELECT 1 FROM users WHERE role = 'general_manager') THEN
      RAISE EXCEPTION 'A general manager already exists';
    END IF;
  END IF;

  -- Prevent changing the general manager's role if it's the designated email
  IF current_user_email = 'yousufabdallah2000@gmail.com' AND 
     current_user_role = 'general_manager' AND 
     user_role != 'general_manager' THEN
    RAISE EXCEPTION 'Cannot change the role of the designated general manager';
  END IF;

  -- Update the user
  UPDATE users
  SET full_name = update_user_with_role.full_name,
      role = update_user_with_role.user_role,
      branch_id = update_user_with_role.branch_id,
      updated_at = NOW()
  WHERE id = user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Create a function to delete users that checks if the current user is a general manager
CREATE OR REPLACE FUNCTION delete_user(
  user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
BEGIN
  -- Check if the current user is a general manager
  IF NOT is_general_manager() THEN
    RAISE EXCEPTION 'Only general managers can delete users';
  END IF;

  -- Get the user's email and role
  SELECT email, role INTO user_email, user_role FROM users WHERE id = user_id;

  -- Prevent deleting the general manager if it's the designated email
  IF user_email = 'yousufabdallah2000@gmail.com' AND user_role = 'general_manager' THEN
    RAISE EXCEPTION 'Cannot delete the designated general manager';
  END IF;

  -- Delete the user
  DELETE FROM users WHERE id = user_id;

  -- In a real application, you would also delete from auth.users
  -- This would typically require additional permissions

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
