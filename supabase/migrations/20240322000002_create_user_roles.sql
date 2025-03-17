-- Create user roles enum
CREATE TYPE user_role AS ENUM ('accountant', 'branch_manager', 'general_manager');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'accountant',
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add realtime
alter publication supabase_realtime add table users;