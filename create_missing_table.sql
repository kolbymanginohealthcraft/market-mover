-- Create the missing user_milestones table
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_name TEXT NOT NULL,
  description TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones" ON user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones" ON user_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones" ON user_milestones
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_type ON user_milestones(milestone_type); 