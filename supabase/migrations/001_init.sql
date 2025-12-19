-- 12WeekDev 数据库初始化脚本
-- 在 Supabase Dashboard -> SQL Editor 中执行此脚本

-- 1. 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  week INT NOT NULL CHECK (week >= 1 AND week <= 12),
  day INT NOT NULL CHECK (day >= 1 AND day <= 84),
  type VARCHAR(20) NOT NULL CHECK (type IN ('algorithm', 'study')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  resource_url TEXT,
  hint TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 每日复盘表
CREATE TABLE IF NOT EXISTS daily_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  content TEXT,
  problems TEXT,
  tomorrow_plan TEXT,
  mood INT CHECK (mood >= 1 AND mood <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 笔记链接表
CREATE TABLE IF NOT EXISTS note_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('yuque', 'notion', 'feishu', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 额外学习记录表
CREATE TABLE IF NOT EXISTS extra_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  duration INT DEFAULT 0,
  resource_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 里程碑表
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week INT NOT NULL CHECK (week >= 1 AND week <= 12),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_week ON tasks(week);
CREATE INDEX IF NOT EXISTS idx_daily_reviews_date ON daily_reviews(date);
CREATE INDEX IF NOT EXISTS idx_note_links_task_id ON note_links(task_id);
CREATE INDEX IF NOT EXISTS idx_extra_learnings_date ON extra_learnings(date);

-- 启用 RLS (Row Level Security) - 可选
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_reviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE extra_learnings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（个人使用，不需要认证）
-- CREATE POLICY "Public access" ON tasks FOR ALL USING (true);
-- CREATE POLICY "Public access" ON daily_reviews FOR ALL USING (true);
-- CREATE POLICY "Public access" ON note_links FOR ALL USING (true);
-- CREATE POLICY "Public access" ON extra_learnings FOR ALL USING (true);
-- CREATE POLICY "Public access" ON milestones FOR ALL USING (true);
