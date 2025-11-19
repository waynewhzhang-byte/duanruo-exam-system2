# 清理Flyway历史记录

$ErrorActionPreference = "Stop"

Write-Host "清理Flyway历史记录..." -ForegroundColor Yellow

$env:PGPASSWORD = "zww0625wh"

# 执行SQL文件
psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -f "scripts/cleanup-flyway-history.sql"

Write-Host "完成！" -ForegroundColor Green

