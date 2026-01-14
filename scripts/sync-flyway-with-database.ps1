# Flyway 与数据库同步脚本
# 目的：诊断并修复 Flyway 迁移历史与实际数据库 schema 的不一致问题
# 
# 使用方法：
#   .\scripts\sync-flyway-with-database.ps1 -Mode diagnose   # 诊断模式（只检查不修改）
#   .\scripts\sync-flyway-with-database.ps1 -Mode repair     # 修复模式（修复历史记录）
#   .\scripts\sync-flyway-with-database.ps1 -Mode baseline   # 基线模式（重建基线）

param(
    [ValidateSet("diagnose", "repair", "baseline")]
    [string]$Mode = "diagnose",
    
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "zww0625wh",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $DatabasePassword

# 颜色输出函数
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Header { param($msg) Write-Host "`n========== $msg ==========" -ForegroundColor Magenta }

# SQL 执行函数
function Invoke-Sql {
    param([string]$Sql, [switch]$Silent)
    $result = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $Sql 2>&1
    if (-not $Silent) { return $result }
}

function Invoke-SqlQuery {
    param([string]$Sql)
    & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c $Sql 2>&1
}

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║         Flyway 与数据库同步工具 v1.0                         ║
║         模式: $Mode                                           
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ============================================================
# 第一部分：诊断 Public Schema 的 Flyway 历史
# ============================================================
Write-Header "诊断 Public Schema"

# 获取当前 Flyway 历史记录
Write-Info "读取 public.flyway_schema_history..."
$publicFlywayHistory = Invoke-Sql "SELECT version, script, success::text FROM public.flyway_schema_history WHERE type = 'SQL' ORDER BY installed_rank;"

# 获取 public schema 迁移脚本文件列表
$publicMigrationPath = "exam-infrastructure/src/main/resources/db/migration"
$publicMigrationFiles = Get-ChildItem -Path $publicMigrationPath -Filter "V*.sql" | ForEach-Object { $_.Name }

Write-Host "`n现有迁移脚本文件:" -ForegroundColor Yellow
$publicMigrationFiles | ForEach-Object { Write-Host "  - $_" }

Write-Host "`nFlyway 历史记录:" -ForegroundColor Yellow
if ($publicFlywayHistory) {
    $publicFlywayHistory -split "`n" | Where-Object { $_.Trim() } | ForEach-Object { Write-Host "  - $_" }
} else {
    Write-Warning "无历史记录"
}

# 检查 public schema 中的实际表
Write-Host "`nPublic Schema 实际表:" -ForegroundColor Yellow
$publicTables = Invoke-Sql "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
$publicTables -split "`n" | Where-Object { $_.Trim() -and $_ -ne "flyway_schema_history" } | ForEach-Object { Write-Host "  - $_" }

# ============================================================
# 第二部分：诊断 Tenant Schemas 的 Flyway 历史
# ============================================================
Write-Header "诊断 Tenant Schemas"

# 获取所有租户 schema
$tenantSchemas = Invoke-Sql "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name;"
$tenantSchemaList = $tenantSchemas -split "`n" | Where-Object { $_.Trim() }

Write-Host "发现 $($tenantSchemaList.Count) 个租户 Schema:" -ForegroundColor Yellow
$tenantSchemaList | ForEach-Object { Write-Host "  - $_" }

# 获取 tenant 迁移脚本文件列表
$tenantMigrationPath = "exam-infrastructure/src/main/resources/db/tenant-migration"
$tenantMigrationFiles = Get-ChildItem -Path $tenantMigrationPath -Filter "V*.sql" | ForEach-Object { $_.Name }

Write-Host "`n租户迁移脚本文件 ($($tenantMigrationFiles.Count) 个):" -ForegroundColor Yellow
$tenantMigrationFiles | ForEach-Object { Write-Host "  - $_" }

# 检查每个租户 schema 的状态
$tenantIssues = @()
foreach ($schema in $tenantSchemaList) {
    if (-not $schema.Trim()) { continue }
    
    Write-Host "`n检查 Schema: $schema" -ForegroundColor Cyan
    
    # 获取该 schema 的 Flyway 历史
    $tenantHistory = Invoke-Sql "SELECT version FROM `"$schema`".flyway_schema_history WHERE type = 'SQL' ORDER BY installed_rank;"
    $executedVersions = ($tenantHistory -split "`n" | Where-Object { $_.Trim() })
    
    Write-Host "  已执行版本: $($executedVersions.Count) 个"
    
    # 检查该 schema 的表
    $tenantTables = Invoke-Sql "SELECT table_name FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE' AND table_name != 'flyway_schema_history' ORDER BY table_name;"
    $tableList = ($tenantTables -split "`n" | Where-Object { $_.Trim() })
    
    Write-Host "  业务表数量: $($tableList.Count) 个"
    
    # 检查预期表是否存在
    $expectedTables = @(
        "applications", "exams", "positions", "subjects", "files", "tickets",
        "venues", "seat_assignments", "reviews", "review_tasks", "exam_reviewers",
        "exam_scores", "payment_orders", "ticket_number_rules", "ticket_sequences"
    )
    
    $missingTables = $expectedTables | Where-Object { $tableList -notcontains $_ }
    if ($missingTables.Count -gt 0) {
        Write-Warning "  缺少表: $($missingTables -join ', ')"
        $tenantIssues += @{ Schema = $schema; Issue = "缺少表"; Details = $missingTables }
    }
    
    # 检查最新迁移是否执行
    $latestVersion = "017"  # V017__Add_position_rules_config.sql
    if ($executedVersions -notcontains $latestVersion) {
        Write-Warning "  最新迁移 V$latestVersion 未执行"
        $tenantIssues += @{ Schema = $schema; Issue = "迁移未执行"; Details = "V$latestVersion" }
    }
}

# ============================================================
# 第三部分：生成诊断报告
# ============================================================
Write-Header "诊断报告"

if ($tenantIssues.Count -eq 0) {
    Write-Success "所有租户 Schema 状态正常！"
} else {
    Write-Warning "发现 $($tenantIssues.Count) 个问题:"
    $tenantIssues | ForEach-Object {
        Write-Host "  - [$($_.Schema)] $($_.Issue): $($_.Details)" -ForegroundColor Yellow
    }
}

# ============================================================
# 第四部分：根据模式执行操作
# ============================================================
if ($Mode -eq "diagnose") {
    Write-Header "诊断完成"
    Write-Info "使用 -Mode repair 执行修复操作"
    Write-Info "使用 -Mode baseline 重建基线（谨慎使用）"
    exit 0
}

if ($Mode -eq "repair") {
    Write-Header "执行修复操作"

    # 修复 Public Schema
    Write-Info "修复 Public Flyway 历史..."

    # 使用 Flyway repair 命令（如果可用）或手动修复
    # 这里我们手动更新 checksum
    Invoke-Sql "UPDATE public.flyway_schema_history SET checksum = NULL WHERE checksum IS NOT NULL;" -Silent
    Write-Success "已清除 checksum（下次运行时会重新计算）"

    # 修复 Tenant Schemas
    foreach ($schema in $tenantSchemaList) {
        if (-not $schema.Trim()) { continue }

        Write-Info "修复 Schema: $schema"

        # 清除 checksum
        Invoke-Sql "UPDATE `"$schema`".flyway_schema_history SET checksum = NULL WHERE checksum IS NOT NULL;" -Silent

        # 检查并补充缺失的迁移记录
        $tenantHistory = Invoke-Sql "SELECT version FROM `"$schema`".flyway_schema_history WHERE type = 'SQL';"
        $executedVersions = ($tenantHistory -split "`n" | Where-Object { $_.Trim() })

        # 检查 positions 表是否有 rules_config 列
        $hasRulesConfig = Invoke-Sql "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '$schema' AND table_name = 'positions' AND column_name = 'rules_config';"

        if ($hasRulesConfig.Trim() -eq "1" -and $executedVersions -notcontains "017") {
            Write-Info "  positions.rules_config 已存在，标记 V017 为已执行"
            $insertSql = @"
INSERT INTO "$schema".flyway_schema_history
(installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
SELECT
  COALESCE(MAX(installed_rank), 0) + 1,
  '017',
  'Add position rules config',
  'SQL',
  'V017__Add_position_rules_config.sql',
  NULL,
  'sync-script',
  CURRENT_TIMESTAMP,
  0,
  true
FROM "$schema".flyway_schema_history;
"@
            Invoke-Sql $insertSql -Silent
            Write-Success "  已添加 V017 记录"
        }
    }

    Write-Header "修复完成"
    Write-Info "请重启后端服务以验证"
}

if ($Mode -eq "baseline") {
    Write-Header "重建基线"
    Write-Warning "此操作将重置 Flyway 历史，仅在必要时使用！"

    $confirm = Read-Host "确认执行？(yes/no)"
    if ($confirm -ne "yes") {
        Write-Info "操作已取消"
        exit 0
    }

    # 为每个租户 schema 创建完整的迁移历史记录
    foreach ($schema in $tenantSchemaList) {
        if (-not $schema.Trim()) { continue }

        Write-Info "重建 Schema: $schema 的 Flyway 历史..."

        # 清空现有历史
        Invoke-Sql "DELETE FROM `"$schema`".flyway_schema_history WHERE type = 'SQL';" -Silent

        # 插入所有迁移记录
        $rank = 1
        foreach ($file in $tenantMigrationFiles) {
            $version = ($file -replace 'V', '' -replace '__.*', '')
            $description = ($file -replace 'V\d+__', '' -replace '\.sql', '' -replace '_', ' ')

            $insertSql = @"
INSERT INTO "$schema".flyway_schema_history
(installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES ($rank, '$version', '$description', 'SQL', '$file', NULL, 'baseline-script', CURRENT_TIMESTAMP, 0, true);
"@
            Invoke-Sql $insertSql -Silent
            $rank++
        }

        Write-Success "  已插入 $($tenantMigrationFiles.Count) 条迁移记录"
    }

    Write-Header "基线重建完成"
}

# 清理
$env:PGPASSWORD = $null

Write-Host "`n完成！" -ForegroundColor Green

