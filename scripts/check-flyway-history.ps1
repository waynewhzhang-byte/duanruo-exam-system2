$env:PGPASSWORD = "zww0625wh"
psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -c "SELECT installed_rank, version, description, type, script, success FROM public.flyway_schema_history ORDER BY installed_rank;"

