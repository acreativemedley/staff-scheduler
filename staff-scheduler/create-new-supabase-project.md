# Create New Supabase Project

Since your current Supabase project URL is not accessible, let's create a new one:

## Step 1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: `staff-scheduler` (or any name you prefer)
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the closest region to you
5. Click **"Create new project"**

## Step 2: Get New Project Credentials

1. Once the project is created, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

## Step 3: Update Environment Variables

Replace the values in your `.env` file:

```
VITE_SUPABASE_URL=https://your-new-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

## Step 4: Set Up Database

1. In your new Supabase project, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and paste this SQL:

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
```

4. Click **"Run"** to execute

## Step 5: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Turn **OFF** "Enable email confirmations" (for testing)
3. Make sure "Enable email signups" is **ON**
4. Click **Save**

## Step 6: Test the New Project

1. Restart your development server: `npm run dev`
2. Go to `http://localhost:5174`
3. Try signing up with a test email

Let me know when you have the new project credentials!