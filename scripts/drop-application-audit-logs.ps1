$env:PGPASSWORD = "zww0625wh"
psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -c "DROP TABLE IF EXISTS public.application_audit_logs CASCADE;"

