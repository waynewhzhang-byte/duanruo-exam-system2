# 执行缺失的租户迁移脚本
$ErrorActionPreference = "Stop"

$env:PGPASSWORD = "zww0625wh"
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbName = "duanruo-exam-system"
$schemaName = "tenant_test_company_a"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "执行缺失的租户迁移脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationFiles = @(
    "exam-infrastructure\src\main\resources\db\tenant-migration\V006__Create_review_management_tables.sql",
    "exam-infrastructure\src\main\resources\db\tenant-migration\V007__Create_score_management_tables.sql",
    "exam-infrastructure\src\main\resources\db\tenant-migration\V008__Create_payment_tables.sql",
    "exam-infrastructure\src\main\resources\db\tenant-migration\V009__Create_ticket_number_tables.sql",
    "exam-infrastructure\src\main\resources\db\tenant-migration\V010__Create_audit_log_tables.sql"
)

foreach ($file in $migrationFiles) {
    Write-Host "执行: $(Split-Path $file -Leaf)" -ForegroundColor Yellow
    
    # 读取SQL文件内容
    $sqlContent = Get-Content $file -Raw
    
    # 添加SET search_path
    $fullSql = "SET search_path TO $schemaName, public; " + $sqlContent
    
    # 执行SQL
    try {
        $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $fullSql 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ 成功" -ForegroundColor Green
        } else {
            Write-Host "   ❌ 失败: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ 异常: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "验证表创建..." -ForegroundColor Yellow

$tables = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema = '$schemaName' ORDER BY table_name;"

Write-Host ""
Write-Host "当前租户Schema中的表:" -ForegroundColor Cyan
$tables -split "`n" | Where-Object { $_ -ne "" } | ForEach-Object {
    Write-Host "   - $_" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 迁移脚本执行完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

