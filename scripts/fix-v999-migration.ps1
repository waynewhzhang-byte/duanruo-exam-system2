# 修复 V999 测试数据迁移脚本
# 问题：V999 会在所有版本号 < 999 的迁移之后执行，可能影响未来的迁移
# 解决方案：
#   1. 删除 Flyway 历史中的 V999 记录
#   2. 将 V999 重命名为环境特定的测试数据脚本
#   3. 或者使用 Repeatable Migration (R__) 格式

param(
    [ValidateSet("analyze", "convert", "remove")]
    [string]$Action = "analyze",
    
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "zww0625wh",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $DatabasePassword

function Invoke-Sql {
    param([string]$Sql)
    & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $Sql 2>&1
}

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║         V999 测试数据迁移修复工具                            ║
║         操作: $Action                                         
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ============================================================
# 分析模式
# ============================================================
if ($Action -eq "analyze") {
    Write-Host "`n[分析] V999 迁移的影响..." -ForegroundColor Yellow
    
    # 检查 V999 在 public schema 的执行状态
    $v999Status = Invoke-Sql "SELECT installed_rank, version, description, success FROM public.flyway_schema_history WHERE version = '999';"
    
    if ($v999Status.Trim()) {
        Write-Host "  ✓ V999 已在 public schema 执行" -ForegroundColor Green
        Write-Host "    记录: $v999Status" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ V999 未在 public schema 执行" -ForegroundColor Yellow
    }
    
    Write-Host "`n[问题分析]" -ForegroundColor Yellow
    Write-Host @"
  
  1. 版本号 999 意味着：
     - 任何 V023 到 V998 的迁移都会在 V999 之后执行（逻辑上）
     - 但 Flyway 会识别它们为"待执行"迁移
  
  2. V999 包含测试数据（DELETE + INSERT 操作）：
     - 如果在生产环境执行，会破坏数据
     - 应该只在开发/测试环境执行
  
  3. 推荐解决方案：
     
     方案 A：转换为 Repeatable Migration (推荐)
       - 将 V999 重命名为 R__BDD_test_data.sql
       - Repeatable 迁移每次内容变化时都会重新执行
       - 通过环境变量或配置控制是否加载
     
     方案 B：移动到单独目录
       - 创建 db/test-data/ 目录
       - 只在开发环境的 Flyway 配置中包含此目录
     
     方案 C：删除 V999（如果不再需要）
       - 从 Flyway 历史中删除记录
       - 删除或重命名脚本文件

"@ -ForegroundColor Cyan

    Write-Host "  使用 -Action convert 执行方案 A（转换为 Repeatable）" -ForegroundColor White
    Write-Host "  使用 -Action remove 执行方案 C（删除记录）" -ForegroundColor White
}

# ============================================================
# 转换模式：将 V999 转换为 Repeatable Migration
# ============================================================
if ($Action -eq "convert") {
    Write-Host "`n[转换] 将 V999 转换为 Repeatable Migration..." -ForegroundColor Yellow
    
    $v999Path = "exam-infrastructure/src/main/resources/db/migration/V999__Insert_BDD_test_data.sql"
    $repeatablePath = "exam-infrastructure/src/main/resources/db/test-data/R__BDD_test_data.sql"
    
    # 创建 test-data 目录
    $testDataDir = "exam-infrastructure/src/main/resources/db/test-data"
    if (-not (Test-Path $testDataDir)) {
        New-Item -ItemType Directory -Path $testDataDir -Force | Out-Null
        Write-Host "  ✓ 创建目录: $testDataDir" -ForegroundColor Green
    }
    
    # 复制文件（添加环境检查）
    $content = Get-Content $v999Path -Raw
    $newContent = @"
-- ============================================================
-- Repeatable Migration: BDD 测试数据
-- 
-- 此脚本仅在开发/测试环境执行
-- 通过 Flyway 配置的 locations 参数控制是否加载
-- 
-- 开发环境配置：
--   flyway.locations=classpath:db/migration,classpath:db/test-data
-- 
-- 生产环境配置（不包含测试数据）：
--   flyway.locations=classpath:db/migration
-- ============================================================

$content
"@
    
    $newContent | Out-File -FilePath $repeatablePath -Encoding UTF8
    Write-Host "  ✓ 创建 Repeatable Migration: $repeatablePath" -ForegroundColor Green
    
    # 从 Flyway 历史中删除 V999 记录
    Write-Host "`n[清理] 从 Flyway 历史中删除 V999 记录..." -ForegroundColor Yellow
    Invoke-Sql "DELETE FROM public.flyway_schema_history WHERE version = '999';"
    Write-Host "  ✓ 已删除 public.flyway_schema_history 中的 V999 记录" -ForegroundColor Green
    
    # 重命名原文件（备份）
    $backupPath = "$v999Path.bak"
    if (Test-Path $v999Path) {
        Move-Item $v999Path $backupPath -Force
        Write-Host "  ✓ 原文件已备份: $backupPath" -ForegroundColor Green
    }
    
    Write-Host "`n[完成] 转换成功！" -ForegroundColor Green
    Write-Host @"

下一步：
  1. 更新 application-dev.yml，添加测试数据目录：
     spring.flyway.locations: classpath:db/migration,classpath:db/test-data
  
  2. 确保 application-prod.yml 不包含测试数据目录：
     spring.flyway.locations: classpath:db/migration
  
  3. 删除备份文件（确认无误后）：
     Remove-Item "$backupPath"

"@ -ForegroundColor Cyan
}

# ============================================================
# 删除模式：从 Flyway 历史中删除 V999
# ============================================================
if ($Action -eq "remove") {
    Write-Host "`n[删除] 从 Flyway 历史中删除 V999 记录..." -ForegroundColor Yellow
    
    $confirm = Read-Host "确认删除 V999 记录？(yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "操作已取消" -ForegroundColor Yellow
        exit 0
    }
    
    Invoke-Sql "DELETE FROM public.flyway_schema_history WHERE version = '999';"
    Write-Host "  ✓ 已删除 V999 记录" -ForegroundColor Green
    
    Write-Host "`n注意：V999 脚本文件仍然存在，下次 Flyway 运行时可能会重新执行" -ForegroundColor Yellow
    Write-Host "建议重命名或删除脚本文件" -ForegroundColor Yellow
}

$env:PGPASSWORD = $null
Write-Host "`n完成！" -ForegroundColor Green

