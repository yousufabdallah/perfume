-- Drop both versions of the function to resolve the conflict
DROP FUNCTION IF EXISTS create_user_with_role(text, text, text, public.user_role, uuid);
DROP FUNCTION IF EXISTS create_user_with_role(text, text, text, text, uuid);

-- Recreate the function with text parameter for user_role
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
