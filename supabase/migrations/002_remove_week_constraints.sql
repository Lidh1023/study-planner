-- 移除 tasks 表的周数和天数上限约束
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_week_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_day_check;

ALTER TABLE tasks ADD CONSTRAINT tasks_week_check CHECK (week >= 1);
ALTER TABLE tasks ADD CONSTRAINT tasks_day_check CHECK (day >= 1);

-- 移除 milestones 表的周数上限约束
ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestones_week_check;

ALTER TABLE milestones ADD CONSTRAINT milestones_week_check CHECK (week >= 1);
