# 清理Public Schema中的业务表
# 目标：删除public schema中所有业务表，只保留全局表（tenants, users等）
# 原因：业务表应该只存在于tenant schema中，public schema只存放全局共享数据

$ErrorActionPreference = "Stop"

# 数据库连接信息
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "duanruo-exam-system"
$DB_USER = "postgres"
$DB_PASSWORD = "zww0625wh"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "清理Public Schema业务表" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置PGPASSWORD环境变量
$env:PGPASSWORD = $DB_PASSWORD

# 辅助函数：执行SQL
function Invoke-Sql {
    param([string]$Sql)
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c $Sql
}

# 定义：应该保留在public schema的全局表
$globalTables = @(
    "tenants",
    "users",
    "user_tenant_roles",
    "audit_logs",
    "tenant_backups",
    "pii_access_logs",
    "notification_templates",
    "notification_histories",
    "flyway_schema_history"
)

# 定义：应该删除的业务表（只应存在于tenant schema）
$businessTables = @(
    "exams",
    "positions",
    "subjects",
    "applications",
    "reviews",
    "tickets",
    "scores",
    "files",
    "payment_orders",
    "exam_scores",
    "seat_assignments",
    "exam_venues",
    "exam_rooms",
    "admission_tickets",
    "payment_records",
    "exam_positions",
    "exam_subjects",
    "exam_registrations",
    "review_records",
    "reviewers",
    "attachments",
    "registration_form_configs"
)

Write-Host "步骤1：检查public schema中的所有表..." -ForegroundColor Yellow
Write-Host ""

# 获取public schema中的所有表
$allTables = Invoke-Sql "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
$tableList = $allTables -split "`n" | Where-Object { $_.Trim() -ne "" }

Write-Host "   找到 $($tableList.Count) 个表:" -ForegroundColor Gray

$tablesToDelete = @()
$tablesToKeep = @()

foreach ($table in $tableList) {
    if ($globalTables -contains $table) {
        $tablesToKeep += $table
        Write-Host "   ✅ $table (全局表，保留)" -ForegroundColor Green
    } elseif ($businessTables -contains $table) {
        $tablesToDelete += $table
        Write-Host "   ❌ $table (业务表，需要删除)" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️  $table (未分类，请手动确认)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "汇总：" -ForegroundColor Cyan
Write-Host "   保留全局表: $($tablesToKeep.Count) 个" -ForegroundColor Green
Write-Host "   删除业务表: $($tablesToDelete.Count) 个" -ForegroundColor Red
Write-Host ""

if ($tablesToDelete.Count -eq 0) {
    Write-Host "✅ Public schema中没有业务表，无需清理" -ForegroundColor Green
    exit 0
}

# 显示将要删除的表
Write-Host "将要删除的业务表：" -ForegroundColor Yellow
foreach ($table in $tablesToDelete) {
    # 检查表中的数据量
    $rowCount = Invoke-Sql "SELECT COUNT(*) FROM public.$table;"
    Write-Host "   - $table ($rowCount 行)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⚠️  警告：此操作将永久删除这些表及其数据！" -ForegroundColor Red
Write-Host "⚠️  业务数据应该存储在tenant schema中，而不是public schema" -ForegroundColor Red
Write-Host ""
Write-Host "是否继续删除？(输入 YES 确认)" -ForegroundColor Cyan
$confirmation = Read-Host

if ($confirmation -ne "YES") {
    Write-Host "❌ 用户取消操作" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "步骤2：删除业务表..." -ForegroundColor Yellow
Write-Host ""

# 删除表（使用CASCADE删除依赖）
foreach ($table in $tablesToDelete) {
    Write-Host "   删除: $table" -ForegroundColor Gray
    
    try {
        Invoke-Sql "DROP TABLE IF EXISTS public.$table CASCADE;" | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $table 已删除" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $table 删除失败" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ $table 删除异常: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "步骤3：清理Flyway历史记录..." -ForegroundColor Yellow
Write-Host ""

# 删除V001-V009的Flyway记录（这些是创建业务表的迁移）
# 保留V010+的记录（租户管理、审计日志等）
Write-Host "   清理V001-V009的迁移记录（业务表创建脚本）..." -ForegroundColor Gray

$versionsToClean = @('001', '002', '003', '004', '005', '006', '007', '008', '009', '1.11', '002.1')

foreach ($version in $versionsToClean) {
    $count = Invoke-Sql "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '$version';"
    
    if ([int]$count -gt 0) {
        Invoke-Sql "DELETE FROM flyway_schema_history WHERE version = '$version';" | Out-Null
        Write-Host "   ✅ 已删除版本 $version 的记录" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "步骤4：验证清理结果..." -ForegroundColor Yellow
Write-Host ""

# 重新检查public schema中的表
$remainingTables = Invoke-Sql "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
$remainingList = $remainingTables -split "`n" | Where-Object { $_.Trim() -ne "" }

Write-Host "   Public schema剩余表：" -ForegroundColor Gray
foreach ($table in $remainingList) {
    if ($globalTables -contains $table) {
        Write-Host "   ✅ $table (全局表)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $table (未知表)" -ForegroundColor Yellow
    }
}

# 检查是否还有业务表残留
$hasBusinessTables = $false
foreach ($table in $remainingList) {
    if ($businessTables -contains $table) {
        $hasBusinessTables = $true
        Write-Host "   ❌ $table (业务表残留！)" -ForegroundColor Red
    }
}

Write-Host ""
if ($hasBusinessTables) {
    Write-Host "❌ 清理失败：仍有业务表残留在public schema" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ 清理成功：public schema中已无业务表" -ForegroundColor Green
}

Write-Host ""
Write-Host "步骤5：检查Flyway迁移历史..." -ForegroundColor Yellow
Write-Host ""

$flywayHistory = Invoke-Sql "SELECT version, description FROM flyway_schema_history WHERE version IS NOT NULL ORDER BY installed_rank;"
$historyList = $flywayHistory -split "`n" | Where-Object { $_.Trim() -ne "" }

Write-Host "   当前Flyway迁移记录：" -ForegroundColor Gray
foreach ($record in $historyList) {
    Write-Host "   - $record" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "清理完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Public Schema状态：" -ForegroundColor Yellow
Write-Host "   ✅ 只包含全局表（tenants, users, user_tenant_roles等）" -ForegroundColor Green
Write-Host "   ✅ 所有业务表已删除" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 为租户schema执行tenant-migration" -ForegroundColor Gray
Write-Host "   运行: .\scripts\fix-multitenant-database.ps1" -ForegroundColor Gray
Write-Host "2. 重新编译项目: mvn clean install -DskipTests" -ForegroundColor Gray
Write-Host "3. 启动后端服务: cd exam-bootstrap && mvn spring-boot:run" -ForegroundColor Gray
Write-Host ""

