-- 检查业务表在哪些schema中
SELECT 
    table_schema, 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_schema = tables.table_schema AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_name IN ('positions', 'exams', 'subjects', 'applications', 'tickets', 'scores')
ORDER BY table_schema, table_name;

