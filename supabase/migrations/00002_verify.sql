-- Schema 验证：逐一检查每张表是否存在
SELECT 'profiles' AS table_name, count(*) AS row_count FROM profiles
UNION ALL
SELECT 'products', count(*) FROM products
UNION ALL
SELECT 'competitors', count(*) FROM competitors
UNION ALL
SELECT 'analysis_reports', count(*) FROM analysis_reports
UNION ALL
SELECT 'feedbacks', count(*) FROM feedbacks
UNION ALL
SELECT 'collection_jobs', count(*) FROM collection_jobs;

-- 检查 RLS 是否已启用（应显示 6 张表）
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- 检查 trigger 是否存在
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';
