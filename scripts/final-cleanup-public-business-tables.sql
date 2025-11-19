-- 最终清理：删除public schema中的所有业务表

-- 检查当前public schema中的业务表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('exams', 'positions', 'subjects', 'applications', 'files', 'tickets', 
                     'payment_orders', 'exam_scores', 'seat_assignments', 'venues', 
                     'exam_admins', 'exam_reviewers', 'review_tasks', 'ticket_number_rules', 
                     'ticket_sequences', 'allocation_batches', 'review_records', 'outbox_events')
ORDER BY table_name;

-- 删除业务表（按依赖顺序）
DROP TABLE IF EXISTS public.outbox_events CASCADE;
DROP TABLE IF EXISTS public.review_records CASCADE;
DROP TABLE IF EXISTS public.allocation_batches CASCADE;
DROP TABLE IF EXISTS public.ticket_sequences CASCADE;
DROP TABLE IF EXISTS public.ticket_number_rules CASCADE;
DROP TABLE IF EXISTS public.review_tasks CASCADE;
DROP TABLE IF EXISTS public.exam_reviewers CASCADE;
DROP TABLE IF EXISTS public.exam_admins CASCADE;
DROP TABLE IF EXISTS public.seat_assignments CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
DROP TABLE IF EXISTS public.exam_scores CASCADE;
DROP TABLE IF EXISTS public.payment_orders CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.positions CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;

-- 验证：检查剩余的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

