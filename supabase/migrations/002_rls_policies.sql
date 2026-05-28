-- Row Level Security Policies

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Tasks: Users can only access own tasks
CREATE POLICY "Users can only access own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Articles: Users can only access own articles
CREATE POLICY "Users can only access own articles" ON articles
  FOR ALL USING (auth.uid() = user_id);

-- Reviews: Users can only access own reviews
CREATE POLICY "Users can only access own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id);
