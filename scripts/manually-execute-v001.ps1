# 手动为租户schema执行V001迁移脚本
# 目的：找出V001执行失败的真正原因

$ErrorActionPreference = "Stop"

$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "duanruo-exam-system"
$DB_USER = "postgres"
$DB_PASSWORD = "zww0625wh"

$env:PGPASSWORD = $DB_PASSWORD

# 目标schema
$targetSchema = "tenant_test_company_a"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "手动执行V001迁移脚本" -ForegroundColor Cyan
Write-Host "目标Schema: $targetSchema" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# V001脚本路径
$v001Path = "exam-infrastructure\src\main\resources\db\tenant-migration\V001__Create_tenant_business_tables.sql"

if (!(Test-Path $v001Path)) {
    Write-Host "❌ 找不到V001脚本: $v001Path" -ForegroundColor Red
    exit 1
}

Write-Host "步骤1：检查当前表结构..." -ForegroundColor Yellow
$currentTables = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema = '$targetSchema' ORDER BY table_name;"

Write-Host "   当前表：" -ForegroundColor Gray
foreach ($table in ($currentTables -split "`n" | Where-Object { $_.Trim() -ne "" })) {
    Write-Host "   - $table" -ForegroundColor Gray
}

Write-Host ""
Write-Host "步骤2：创建临时SQL文件（包含search_path）..." -ForegroundColor Yellow

# 读取V001内容
$v001Content = Get-Content $v001Path -Raw

# 创建临时文件
$tempFile = [System.IO.Path]::GetTempFileName() + ".sql"

# 添加search_path和详细错误输出
$fullSql = @"
-- 设置search_path
SET search_path TO "$targetSchema", public;

-- 显示当前search_path
SHOW search_path;

-- 启用详细错误输出
\set ON_ERROR_STOP on
\set VERBOSITY verbose

-- 执行V001内容
$v001Content
"@

Set-Content -Path $tempFile -Value $fullSql -Encoding UTF8

Write-Host "   临时文件: $tempFile" -ForegroundColor Gray
Write-Host ""

Write-Host "步骤3：执行SQL脚本..." -ForegroundColor Yellow
Write-Host ""

# 执行并捕获详细输出
$output = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $tempFile 2>&1

Write-Host "执行输出：" -ForegroundColor Cyan
Write-Host $output
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 脚本执行成功" -ForegroundColor Green
} else {
    Write-Host "❌ 脚本执行失败，返回码: $LASTEXITCODE" -ForegroundColor Red
}

Write-Host ""
Write-Host "步骤4：检查执行后的表结构..." -ForegroundColor Yellow

$newTables = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema = '$targetSchema' ORDER BY table_name;"

Write-Host "   执行后的表：" -ForegroundColor Gray
foreach ($table in ($newTables -split "`n" | Where-Object { $_.Trim() -ne "" })) {
    Write-Host "   - $table" -ForegroundColor Gray
}

# 清理临时文件
Remove-Item $tempFile -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

