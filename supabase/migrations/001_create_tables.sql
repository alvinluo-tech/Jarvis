-- Jarvis Personal Command Center - Database Schema
-- Supabase PostgreSQL

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'deleted')),
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status != 'deleted';

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'reading', 'finished')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  category TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_articles_user_status ON articles(user_id, status);

-- 回顾记录表
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  task_completion_rate NUMERIC(5,2),
  articles_read INTEGER,
  summary TEXT,
  patterns TEXT[],
  suggestions TEXT[],
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_user_type ON reviews(user_id, type, period_start DESC);
