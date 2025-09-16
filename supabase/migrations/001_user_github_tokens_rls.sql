-- Enable Row Level Security on user_github_tokens table
ALTER TABLE user_github_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own tokens
CREATE POLICY "Users can view own tokens" ON user_github_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own tokens
CREATE POLICY "Users can insert own tokens" ON user_github_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own tokens
CREATE POLICY "Users can update own tokens" ON user_github_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own tokens
CREATE POLICY "Users can delete own tokens" ON user_github_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_github_tokens_user_id ON user_github_tokens(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_github_tokens_updated_at 
  BEFORE UPDATE ON user_github_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
