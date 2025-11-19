# 验证租户Schema中的表

$env:PGPASSWORD = "zww0625wh"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "验证租户Schema中的表" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "查询 tenant_test_company_a schema 中的所有表..." -ForegroundColor Yellow
Write-Host ""

$query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_test_company_a' ORDER BY table_name;"

psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -c $query

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "查询Flyway迁移历史..." -ForegroundColor Yellow
Write-Host ""

$query2 = "SELECT installed_rank, version, description, installed_on, success FROM tenant_test_company_a.flyway_schema_history ORDER BY installed_rank;"

psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -c $query2

Write-Host ""
Write-Host "验证完成！" -ForegroundColor Green

