-- Supabase SQL Schema for Food Waste Score Kiosk
-- Run these commands in your Supabase SQL Editor

-- Create user_scores table
CREATE TABLE IF NOT EXISTS user_scores (
  id SERIAL PRIMARY KEY,
  netid VARCHAR(50) NOT NULL,
  meal_period VARCHAR(20) NOT NULL CHECK (meal_period IN ('breakfast', 'lunch', 'dinner', 'other')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  dish_type VARCHAR(20) NOT NULL CHECK (dish_type IN ('plate', 'salad', 'cereal')),
  weight_grams DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard_entries table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id SERIAL PRIMARY KEY,
  initials VARCHAR(3) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  netid VARCHAR(50),
  meal_period VARCHAR(20) CHECK (meal_period IN ('breakfast', 'lunch', 'dinner', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create allowed_netids table for access control
CREATE TABLE IF NOT EXISTS allowed_netids (
  id SERIAL PRIMARY KEY,
  netid VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_scores_netid_meal ON user_scores(netid, meal_period);
CREATE INDEX IF NOT EXISTS idx_user_scores_created_at ON user_scores(created_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_entries(score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_allowed_netids_netid ON allowed_netids(netid);

-- Create RLS (Row Level Security) policies
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_netids ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for kiosk use)
CREATE POLICY "Allow public read access to user_scores" ON user_scores
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to leaderboard_entries" ON leaderboard_entries
  FOR SELECT USING (true);

-- Allow public read access to allowed_netids (for validation)
CREATE POLICY "Allow public read access to allowed_netids" ON allowed_netids
  FOR SELECT USING (true);

-- Allow public insert access (for kiosk submissions)
CREATE POLICY "Allow public insert access to user_scores" ON user_scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to leaderboard_entries" ON leaderboard_entries
  FOR INSERT WITH CHECK (true);

-- Note: allowed_netids should only be inserted by admins via Supabase dashboard or service role

-- Create functions for database initialization (called from app)
CREATE OR REPLACE FUNCTION create_user_scores_table()
RETURNS void AS $$
BEGIN
  -- Table already exists, function just returns
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_leaderboard_table()
RETURNS void AS $$
BEGIN
  -- Table already exists, function just returns
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy analytics
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_scans,
  ROUND(AVG(score)) as average_score,
  COUNT(DISTINCT netid) as unique_users
FROM user_scores
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create a view for meal period analytics
CREATE OR REPLACE VIEW meal_period_stats AS
SELECT 
  meal_period,
  COUNT(*) as total_scans,
  ROUND(AVG(score)) as average_score,
  COUNT(DISTINCT netid) as unique_users
FROM user_scores
GROUP BY meal_period
ORDER BY meal_period;
