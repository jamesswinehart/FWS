-- NetID Access Control Schema Update
-- Run this in your Supabase SQL Editor

-- Create allowed_netids table for access control
CREATE TABLE IF NOT EXISTS allowed_netids (
  id SERIAL PRIMARY KEY,
  netid VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_allowed_netids_netid ON allowed_netids(netid);

-- Enable RLS (Row Level Security)
ALTER TABLE allowed_netids ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for validation)
-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow public read access to allowed_netids" ON allowed_netids;
CREATE POLICY "Allow public read access to allowed_netids" ON allowed_netids
  FOR SELECT USING (true);

-- Note: Only admins should be able to INSERT/UPDATE/DELETE NetIDs
-- Use service role key for admin operations if needed

