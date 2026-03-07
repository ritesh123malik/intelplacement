-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requests_today INT DEFAULT 0,
  last_request_date DATE DEFAULT CURRENT_DATE,
  total_requests INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, last_request_date)
);

-- Enable RLS
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own usage" ON user_ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON user_ai_usage
  FOR ALL TO service_role USING (true);
