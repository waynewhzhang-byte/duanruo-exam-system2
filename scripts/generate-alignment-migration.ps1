# 生成对齐迁移脚本
# 目的：比较数据库实际结构与迁移脚本预期结构，生成补丁迁移
#
# 使用方法：
#   .\scripts\generate-alignment-migration.ps1

param(
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "zww0625wh",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432,
    [string]$ReferenceSchema = "tenant_test_company_a"
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $DatabasePassword

function Invoke-Sql {
    param([string]$Sql)
    & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $Sql 2>&1
}

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║         生成 Flyway 对齐迁移脚本                             ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ============================================================
# 第一步：获取参考 Schema 的完整结构
# ============================================================
Write-Host "`n[步骤1] 获取参考 Schema ($ReferenceSchema) 的结构..." -ForegroundColor Yellow

# 获取所有表和列
$columnsQuery = @"
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision
FROM information_schema.columns 
WHERE table_schema = '$ReferenceSchema' 
  AND table_name != 'flyway_schema_history'
ORDER BY table_name, ordinal_position;
"@

$referenceColumns = Invoke-Sql $columnsQuery
Write-Host "  找到 $(($referenceColumns -split "`n").Count) 个列定义" -ForegroundColor Green

# 获取索引
$indexQuery = @"
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = '$ReferenceSchema'
  AND tablename != 'flyway_schema_history'
ORDER BY tablename, indexname;
"@

$referenceIndexes = Invoke-Sql $indexQuery
Write-Host "  找到 $(($referenceIndexes -split "`n").Count) 个索引" -ForegroundColor Green

# 获取约束
$constraintQuery = @"
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = '$ReferenceSchema'
  AND tc.table_name != 'flyway_schema_history'
ORDER BY tc.table_name, tc.constraint_name;
"@

$referenceConstraints = Invoke-Sql $constraintQuery
Write-Host "  找到 $(($referenceConstraints -split "`n").Count) 个约束" -ForegroundColor Green

# ============================================================
# 第二步：比较每个租户 Schema
# ============================================================
Write-Host "`n[步骤2] 比较所有租户 Schema..." -ForegroundColor Yellow

$tenantSchemas = Invoke-Sql "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' AND schema_name != '$ReferenceSchema' ORDER BY schema_name;"
$schemaList = $tenantSchemas -split "`n" | Where-Object { $_.Trim() }

$differences = @()

foreach ($schema in $schemaList) {
    if (-not $schema.Trim()) { continue }
    
    Write-Host "  检查: $schema" -ForegroundColor Cyan
    
    # 比较列
    $schemaColumns = Invoke-Sql ($columnsQuery -replace $ReferenceSchema, $schema)
    
    # 比较 positions 表的 rules_config 列
    $hasRulesConfig = Invoke-Sql "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '$schema' AND table_name = 'positions' AND column_name = 'rules_config';"
    
    if ($hasRulesConfig.Trim() -eq "0") {
        $differences += @{
            Schema = $schema
            Table = "positions"
            Column = "rules_config"
            Issue = "列缺失"
            Fix = "ALTER TABLE `"$schema`".positions ADD COLUMN IF NOT EXISTS rules_config JSONB;"
        }
        Write-Host "    ⚠ 缺少 positions.rules_config" -ForegroundColor Yellow
    }
}

# ============================================================
# 第三步：生成对齐迁移脚本
# ============================================================
Write-Host "`n[步骤3] 生成对齐迁移脚本..." -ForegroundColor Yellow

$nextVersion = "018"
$migrationFile = "exam-infrastructure/src/main/resources/db/tenant-migration/V${nextVersion}__Align_schema_structure.sql"

$migrationContent = @"
-- ============================================================
-- V${nextVersion}: 对齐 Schema 结构
-- 
-- 此迁移脚本由 generate-alignment-migration.ps1 自动生成
-- 目的：确保所有租户 Schema 与标准结构一致
-- 生成时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- ============================================================

-- 确保 positions 表有 rules_config 列（岗位级别自动审核规则）
ALTER TABLE positions ADD COLUMN IF NOT EXISTS rules_config JSONB;

-- 添加注释
COMMENT ON COLUMN positions.rules_config IS '岗位级别自动审核规则配置（JSON格式）';

-- 刷新统计信息
ANALYZE positions;
"@

# 检查是否有差异需要修复
if ($differences.Count -gt 0) {
    Write-Host "  发现 $($differences.Count) 个差异，生成迁移脚本..." -ForegroundColor Yellow
    
    # 写入迁移文件
    $migrationContent | Out-File -FilePath $migrationFile -Encoding UTF8
    Write-Host "  ✓ 已生成: $migrationFile" -ForegroundColor Green
    
    # 显示差异详情
    Write-Host "`n差异详情:" -ForegroundColor Yellow
    $differences | ForEach-Object {
        Write-Host "  - [$($_.Schema)] $($_.Table).$($_.Column): $($_.Issue)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ✓ 所有 Schema 结构一致，无需生成对齐迁移" -ForegroundColor Green
}

# ============================================================
# 第四步：生成手动修复 SQL（如果需要立即修复）
# ============================================================
if ($differences.Count -gt 0) {
    Write-Host "`n[步骤4] 生成立即修复 SQL..." -ForegroundColor Yellow
    
    $fixSqlFile = "scripts/fix-schema-differences.sql"
    $fixContent = @"
-- ============================================================
-- 立即修复 Schema 差异
-- 
-- 运行方式：psql -d duanruo-exam-system -f scripts/fix-schema-differences.sql
-- 生成时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- ============================================================

"@

    foreach ($diff in $differences) {
        $fixContent += "-- 修复 $($diff.Schema).$($diff.Table).$($diff.Column)`n"
        $fixContent += "$($diff.Fix)`n`n"
    }
    
    # 同时更新 Flyway 历史
    $fixContent += @"
-- 更新 Flyway 历史记录（标记 V017 为已执行）
"@

    foreach ($schema in ($differences | Select-Object -ExpandProperty Schema -Unique)) {
        $fixContent += @"

DO `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "$schema".flyway_schema_history WHERE version = '017') THEN
        INSERT INTO "$schema".flyway_schema_history 
        (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
        SELECT 
          COALESCE(MAX(installed_rank), 0) + 1, 
          '017', 
          'Add position rules config', 
          'SQL', 
          'V017__Add_position_rules_config.sql', 
          NULL, 
          'manual-fix', 
          CURRENT_TIMESTAMP, 
          0, 
          true
        FROM "$schema".flyway_schema_history;
    END IF;
END `$`$;
"@
    }

    $fixContent | Out-File -FilePath $fixSqlFile -Encoding UTF8
    Write-Host "  ✓ 已生成: $fixSqlFile" -ForegroundColor Green
    Write-Host "`n  运行修复命令:" -ForegroundColor Cyan
    Write-Host "    psql -d $DatabaseName -f $fixSqlFile" -ForegroundColor White
}

# 清理
$env:PGPASSWORD = $null

Write-Host "`n完成！" -ForegroundColor Green

