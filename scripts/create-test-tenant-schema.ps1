# 手动创建测试租户schema并执行tenant-migration
# 用于解决后端无法启动的问题

$ErrorActionPreference = "Stop"

# 数据库连接信息
$env:PGPASSWORD = "zww0625wh"
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbName = "duanruo-exam-system"

function Invoke-Sql {
    param([string]$sql)
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $sql 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "SQL执行失败: $result"
    }
    return $result
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "创建测试租户Schema并执行Tenant Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤1：检查租户是否存在
Write-Host "步骤1：检查测试租户..." -ForegroundColor Yellow
$tenantId = "00000000-0000-0000-0000-000000000001"
$tenantExists = Invoke-Sql "SELECT COUNT(*) FROM public.tenants WHERE id = '$tenantId'::uuid;"

if ([int]$tenantExists -eq 0) {
    Write-Host "   ❌ 测试租户不存在" -ForegroundColor Red
    Write-Host "   提示：V999迁移应该已经创建了测试租户" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "   ✅ 测试租户存在" -ForegroundColor Green
}

# 步骤2：创建租户schema
Write-Host ""
Write-Host "步骤2：创建租户schema..." -ForegroundColor Yellow
$schemaName = "tenant_test_company_a"

try {
    Invoke-Sql "CREATE SCHEMA IF NOT EXISTS $schemaName;" | Out-Null
    Write-Host "   ✅ Schema创建成功: $schemaName" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Schema可能已存在: $schemaName" -ForegroundColor Yellow
}

# 步骤3：执行tenant-migration脚本
Write-Host ""
Write-Host "步骤3：执行tenant-migration脚本..." -ForegroundColor Yellow

$migrationDir = "exam-infrastructure\src\main\resources\db\tenant-migration"
$migrationFiles = Get-ChildItem -Path $migrationDir -Filter "V*.sql" | Sort-Object Name

foreach ($file in $migrationFiles) {
    Write-Host "   执行: $($file.Name)" -ForegroundColor Gray
    
    try {
        # 设置search_path并执行SQL
        $sql = "SET search_path TO $schemaName, public; " + (Get-Content $file.FullName -Raw)
        $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $sql 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "      ✅ 成功" -ForegroundColor Green
        } else {
            Write-Host "      ⚠️  警告: $result" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "      ❌ 失败: $_" -ForegroundColor Red
    }
}

# 步骤4：验证表是否创建成功
Write-Host ""
Write-Host "步骤4：验证表创建..." -ForegroundColor Yellow

$requiredTables = @(
    "exams", "positions", "subjects", "applications", 
    "tickets", "venues", "allocation_batches", "seat_assignments"
)

$missingTables = @()
foreach ($table in $requiredTables) {
    $exists = Invoke-Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schemaName' AND table_name = '$table';"
    
    if ([int]$exists -eq 0) {
        $missingTables += $table
        Write-Host "   ❌ $table - 不存在" -ForegroundColor Red
    } else {
        Write-Host "   ✅ $table - 存在" -ForegroundColor Green
    }
}

Write-Host ""
if ($missingTables.Count -eq 0) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ 测试租户Schema创建成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "下一步：重新启动后端" -ForegroundColor Yellow
    Write-Host "   java -jar exam-bootstrap/target/exam-bootstrap-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev" -ForegroundColor Gray
} else {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "⚠️  部分表创建失败" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "缺失的表: $($missingTables -join ', ')" -ForegroundColor Red
    exit 1
}

