-- T2: Lensmor Monitor 完整 Schema
-- 依赖：Supabase Auth（auth.users 表由 Supabase 自动管理）

-- 0. 用户 Profile（扩展 Supabase auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('产品营销经理', '产品经理', '市场营销经理', '创始人', '投资人', '其他')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_user_isolation" ON profiles;
CREATE POLICY "profiles_user_isolation" ON profiles
  FOR ALL USING (auth.uid() = id);

-- 自动创建 profile 的 trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 1. 产品信息（用户在引导中填写的自有产品）
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  selling_points TEXT,
  advantages TEXT,
  strategy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_user_isolation" ON products;
CREATE POLICY "products_user_isolation" ON products
  FOR ALL USING (auth.uid() = user_id);

-- 2. 竞品
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'monitoring'
    CHECK (status IN ('monitoring', 'paused', 'collecting')),
  related_links JSONB DEFAULT '[]'::jsonb,
  company_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "competitors_user_isolation" ON competitors;
CREATE POLICY "competitors_user_isolation" ON competitors
  FOR ALL USING (auth.uid() = user_id);

-- 3. 分析报告
CREATE TABLE IF NOT EXISTS analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  change_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  strategic_intent TEXT,
  action_suggestions JSONB DEFAULT '[]'::jsonb,
  priority TEXT NOT NULL DEFAULT 'low'
    CHECK (priority IN ('urgent', 'medium', 'low')),
  source_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analysis_reports_user_isolation" ON analysis_reports;
CREATE POLICY "analysis_reports_user_isolation" ON analysis_reports
  FOR ALL USING (auth.uid() = user_id);

-- 4. 情报反馈
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('useful', 'wrong', 'not_important')),
  error_type TEXT CHECK (error_type IN (
    'inaccurate', 'irrelevant', 'outdated', 'duplicate',
    'wrong_intent', 'missing_change', 'too_noisy', 'bad_source'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedbacks_user_isolation" ON feedbacks;
CREATE POLICY "feedbacks_user_isolation" ON feedbacks
  FOR ALL USING (auth.uid() = user_id);

-- 5. 采集任务
CREATE TABLE IF NOT EXISTS collection_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  error TEXT,
  result_html TEXT,
  result_screenshot TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collection_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collection_jobs_user_isolation" ON collection_jobs;
CREATE POLICY "collection_jobs_user_isolation" ON collection_jobs
  FOR ALL USING (auth.uid() = user_id);
