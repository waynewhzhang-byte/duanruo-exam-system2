# 在Flyway history中标记V001-V016为已执行，防止Flyway尝试重新执行

$env:PGPASSWORD = "zww0625wh"

Write-Host "在Flyway history中标记已禁用的迁移脚本为已执行..." -ForegroundColor Yellow

# 插入V001-V016的记录（标记为成功执行）
$sql = @"
-- 标记V001-V016为已执行（这些脚本已被禁用，不应再执行）
INSERT INTO public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES 
(1, '001', 'Create initial tables', 'SQL', 'V001__Create_initial_tables.sql', 0, 'postgres', 0, true),
(2, '002', 'Create review tasks', 'SQL', 'V002__Create_review_tasks.sql', 0, 'postgres', 0, true),
(3, '003', 'Create venues and seating', 'SQL', 'V003__Create_venues_and_seating.sql', 0, 'postgres', 0, true),
(4, '004', 'Create ticket numbering', 'SQL', 'V004__Create_ticket_numbering.sql', 0, 'postgres', 0, true),
(5, '005', 'add rules config to exams', 'SQL', 'V005__add_rules_config_to_exams.sql', 0, 'postgres', 0, true),
(6, '006', 'create exam reviewers', 'SQL', 'V006__create_exam_reviewers.sql', 0, 'postgres', 0, true),
(7, '007', 'Create exam admin and scores', 'SQL', 'V007__Create_exam_admin_and_scores.sql', 0, 'postgres', 0, true),
(8, '008', 'Add slug to exams', 'SQL', 'V008__Add_slug_to_exams.sql', 0, 'postgres', 0, true),
(9, '009', 'Fix version constraints', 'SQL', 'V009__Fix_version_constraints.sql', 0, 'postgres', 0, true),
(13, '012', 'Create tickets table', 'SQL', 'V012__Create_tickets_table.sql', 0, 'postgres', 0, true),
(14, '013', 'Create payment orders table', 'SQL', 'V013__Create_payment_orders_table.sql', 0, 'postgres', 0, true),
(15, '014', 'Enhance ticket number rules', 'SQL', 'V014__Enhance_ticket_number_rules.sql', 0, 'postgres', 0, true),
(16, '016', 'Extend public tickets encrypted columns', 'SQL', 'V016__Extend_public_tickets_encrypted_columns.sql', 0, 'postgres', 0, true)
ON CONFLICT DO NOTHING;
"@

psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -c "$sql"

Write-Host "完成！检查Flyway history:" -ForegroundColor Green
psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -c "SELECT installed_rank, version, description, success FROM public.flyway_schema_history ORDER BY installed_rank;"

