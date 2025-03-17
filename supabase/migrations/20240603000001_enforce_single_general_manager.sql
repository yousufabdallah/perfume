-- Create a function to check if the general manager email is the specified one
CREATE OR REPLACE FUNCTION check_general_manager_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If the role is general_manager, check if the email is the allowed one
  IF NEW.role = 'general_manager' AND NEW.email != 'yousufabdallah2000@gmail.com' THEN
    RAISE EXCEPTION 'Only yousufabdallah2000@gmail.com can be the general manager';
  END IF;
  
  -- If trying to update the general manager's email
  IF NEW.email != OLD.email AND OLD.role = 'general_manager' AND OLD.email = 'yousufabdallah2000@gmail.com' THEN
    RAISE EXCEPTION 'Cannot change the email of the general manager';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to enforce the rule
DROP TRIGGER IF EXISTS enforce_single_general_manager ON users;
CREATE TRIGGER enforce_single_general_manager
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_general_manager_email();

-- Create a trigger for new insertions
DROP TRIGGER IF EXISTS enforce_single_general_manager_insert ON users;
CREATE TRIGGER enforce_single_general_manager_insert
BEFORE INSERT ON users
FOR EACH ROW
WHEN (NEW.role = 'general_manager')
EXECUTE FUNCTION check_general_manager_email();

-- Update the create_user_with_role function to enforce the rule
CREATE OR REPLACE FUNCTION create_user_with_role(
    email TEXT,
    password TEXT,
    full_name TEXT,
    user_role user_role,
    branch_id UUID
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    gm_count INTEGER;
BEGIN
    -- Check if current user is general manager
    IF NOT is_general_manager() THEN
        RAISE EXCEPTION 'Only general managers can create users';
    END IF;
    
    -- If trying to create a general manager, check if it's the allowed email
    IF user_role = 'general_manager' AND email != 'yousufabdallah2000@gmail.com' THEN
        RAISE EXCEPTION 'Only yousufabdallah2000@gmail.com can be the general manager';
    END IF;
    
    -- Check if a general manager already exists when trying to create one
    IF user_role = 'general_manager' THEN
        SELECT COUNT(*) INTO gm_count FROM users WHERE role = 'general_manager';
        IF gm_count > 0 THEN
            RAISE EXCEPTION 'A general manager already exists';
        END IF;
    END IF;
    
    -- Create user in auth.users
    INSERT INTO auth.users (email, password, email_confirmed_at, raw_user_meta_data)
    VALUES (email, password, NOW(), jsonb_build_object('full_name', full_name, 'role', user_role))
    RETURNING id INTO new_user_id;
    
    -- Create user in public.users
    INSERT INTO users (id, full_name, email, role, branch_id)
    VALUES (new_user_id, full_name, email, user_role, branch_id);
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;