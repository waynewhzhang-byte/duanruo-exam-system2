# 最终清理public schema中的业务表

$ErrorActionPreference = "Stop"

Write-Host "最终清理public schema中的业务表..." -ForegroundColor Yellow

$env:PGPASSWORD = "zww0625wh"

# 执行SQL文件
psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -f "scripts/final-cleanup-public-business-tables.sql"

Write-Host "完成！" -ForegroundColor Green

