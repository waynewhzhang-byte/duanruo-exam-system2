-- 清空flyway_schema_history表
TRUNCATE TABLE public.flyway_schema_history;

-- 重新插入正确的迁移记录（按顺序）
INSERT INTO public.flyway_schema_history 
(installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES 
(1, '002.1', 'Create user tables', 'SQL', 'V002_1__Create_user_tables.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(2, '009.1', 'Fix users version constraint', 'SQL', 'V009_1__Fix_users_version_constraint.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(3, '010', 'Create tenant tables', 'SQL', 'V010__Create_tenant_tables.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(4, '011', 'Add performance indexes', 'SQL', 'V011__Add_performance_indexes.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(5, '015', 'Extend columns for encryption', 'SQL', 'V015__Extend_columns_for_encryption.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(6, '017', 'create notification templates table', 'SQL', 'V017__create_notification_templates_table.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(7, '018', 'create notification histories table', 'SQL', 'V018__create_notification_histories_table.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(8, '019', 'create pii access logs table', 'SQL', 'V019__create_pii_access_logs_table.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(9, '020', 'create tenant backups table', 'SQL', 'V020__create_tenant_backups_table.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(10, '021', 'create audit logs table', 'SQL', 'V021__create_audit_logs_table.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(11, '1.11', 'Add exam status in progress completed', 'SQL', 'V1.11__Add_exam_status_in_progress_completed.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true),
(12, '999', 'Insert BDD test data', 'SQL', 'V999__Insert_BDD_test_data.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true);

-- 插入R__seed_admin.sql（可重复迁移）
INSERT INTO public.flyway_schema_history 
(installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES 
(13, NULL, 'seed admin', 'SQL', 'R__seed_admin.sql', NULL, 'postgres', CURRENT_TIMESTAMP, 0, true);

-- 显示结果
SELECT installed_rank, version, description, type, script, success 
FROM public.flyway_schema_history 
ORDER BY installed_rank;

