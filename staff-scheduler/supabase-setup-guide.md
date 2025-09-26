# Quick Supabase Setup Guide

## Step 1: Verify Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click on your project: `sawgzphbmpwesfeurighd`
3. Make sure you're in the right project dashboard

## Step 2: Create the Database Tables

1. In your Supabase dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy and paste this SQL code:

```sql
-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100),
  role VARCHAR(50) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all employees
CREATE POLICY "Allow authenticated users to read employees" 
ON employees FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to allow authenticated users to insert employees
CREATE POLICY "Allow authenticated users to insert employees" 
ON employees FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy to allow authenticated users to update employees
CREATE POLICY "Allow authenticated users to update employees" 
ON employees FOR UPDATE 
TO authenticated 
USING (true);

-- Insert some sample data
INSERT INTO employees (full_name, email, phone, position, role) VALUES
  ('John Doe', 'john.doe@example.com', '555-0101', 'Server', 'staff'),
  ('Jane Smith', 'jane.smith@example.com', '555-0102', 'Manager', 'manager'),
  ('Bob Johnson', 'bob.johnson@example.com', '555-0103', 'Cook', 'staff'),
  ('Alice Brown', 'alice.brown@example.com', '555-0104', 'Host', 'staff');
```

4. Click **"Run"** to execute the SQL

## Step 3: Enable Authentication (if needed)

1. In your Supabase dashboard, go to **"Authentication"** → **"Settings"**
2. Make sure **"Enable email confirmations"** is turned OFF for testing (you can turn it on later)
3. Under **"Auth Providers"**, make sure **"Email"** is enabled

## Step 4: Test the Connection

1. Go back to your app at `http://localhost:5173`
2. Click "Test Again" in the connection test section
3. You should see "✅ Supabase connection and database successful!"

## Troubleshooting

If you still get errors:

1. **Double-check your .env file** - make sure the URL and key match your Supabase project
2. **Check the browser console** for more detailed error messages
3. **Try a different browser** to rule out cache issues
4. **Check your internet connection** - corporate firewalls sometimes block Supabase

Let me know what happens after running the SQL!