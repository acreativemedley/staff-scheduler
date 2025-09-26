-- Update for Time-Off Requests with Partial Day Support
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing time_off_requests table and recreate with new fields
DROP TABLE IF EXISTS time_off_requests CASCADE;

-- Create updated time_off_requests table with partial day support
CREATE TABLE time_off_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  request_type VARCHAR(20) DEFAULT 'full_days' CHECK (request_type IN ('full_days', 'partial_day')),
  partial_start_time TIME, -- Only used for partial_day requests
  partial_end_time TIME,   -- Only used for partial_day requests
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'denied')),
  reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES employees(id),
  manager_notes TEXT
);

-- Enable Row Level Security
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for time_off_requests
CREATE POLICY "Users can view all time off requests" ON time_off_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create time off requests" ON time_off_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update time off requests" ON time_off_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete time off requests" ON time_off_requests FOR DELETE TO authenticated USING (true);