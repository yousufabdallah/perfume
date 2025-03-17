-- Function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    current_role user_role;
BEGIN
    SELECT role INTO current_role FROM users WHERE id = auth.uid();
    RETURN current_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is general manager
CREATE OR REPLACE FUNCTION is_general_manager()
RETURNS BOOLEAN AS $$
DECLARE
    is_gm BOOLEAN;
BEGIN
    SELECT (role = 'general_manager') INTO is_gm FROM users WHERE id = auth.uid();
    RETURN COALESCE(is_gm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is branch manager
CREATE OR REPLACE FUNCTION is_branch_manager()
RETURNS BOOLEAN AS $$
DECLARE
    is_bm BOOLEAN;
BEGIN
    SELECT (role = 'branch_manager') INTO is_bm FROM users WHERE id = auth.uid();
    RETURN COALESCE(is_bm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's branch id
CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID AS $$
DECLARE
    branch_id UUID;
BEGIN
    SELECT users.branch_id INTO branch_id FROM users WHERE id = auth.uid();
    RETURN branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new user with role
CREATE OR REPLACE FUNCTION create_user_with_role(
    email TEXT,
    password TEXT,
    full_name TEXT,
    user_role user_role,
    branch_id UUID
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if current user is general manager
    IF NOT is_general_manager() THEN
        RAISE EXCEPTION 'Only general managers can create users';
    END IF;
    
    -- Create user in auth.users
    INSERT INTO auth.users (email, password, email_confirmed_at)
    VALUES (email, password, NOW())
    RETURNING id INTO new_user_id;
    
    -- Create user in public.users
    INSERT INTO users (id, full_name, email, role, branch_id)
    VALUES (new_user_id, full_name, email, user_role, branch_id);
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;