@echo off
REM Execute missing tenant migration tables

set PGPASSWORD=zww0625wh
psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -f scripts\create-missing-tables.sql

echo.
echo Verifying tables...
psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_test_company_a' ORDER BY table_name;"

echo.
echo Done!
pause

