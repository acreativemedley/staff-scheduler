# Database Schema for Simple Staff Scheduler Proof of Concept

## Run these SQL commands in your Supabase SQL Editor

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

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL commands above
4. Run them to create your database schema
5. Copy your project URL and anon key to your .env file