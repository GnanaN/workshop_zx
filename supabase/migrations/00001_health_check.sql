-- T0: 通路验证表
CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 允许匿名读写（验证用，验证完成后收紧或删表）
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_for_verify" ON health_check FOR ALL USING (true);
