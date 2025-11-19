# 最终修复：禁用public schema中的业务表迁移脚本
# 基于详细分析报告：MIGRATION_ANALYSIS.md

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复Public Schema迁移脚本（最终版）" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationDir = "exam-infrastructure\src\main\resources\db\migration"

if (!(Test-Path $migrationDir)) {
    Write-Host "❌ 找不到迁移目录: $migrationDir" -ForegroundColor Red
    exit 1
}

# 定义：需要禁用的脚本（业务表迁移）
$scriptsToDisable = @(
    "V001__Create_initial_tables.sql",
    "V002__Create_review_tasks.sql",
    "V003__Create_venues_and_seating.sql",
    "V004__Create_ticket_numbering.sql",
    "V005__add_rules_config_to_exams.sql",
    "V006__create_exam_reviewers.sql",
    "V007__Create_exam_admin_and_scores.sql",
    "V008__Add_slug_to_exams.sql",
    "V009__Fix_version_constraints.sql",  # 混合脚本，已拆分为V009_1
    "V012__Create_tickets_table.sql",
    "V013__Create_payment_orders_table.sql",
    "V014__Enhance_ticket_number_rules.sql",
    "V016__Extend_public_tickets_encrypted_columns.sql"  # 错误脚本
)

# 定义：需要保留的脚本（全局表迁移 + 工具函数）
$scriptsToKeep = @(
    "V002_1__Create_user_tables.sql",           # 用户表（全局）
    "V009_1__Fix_users_version_constraint.sql", # users表version字段修复（新建）
    "V010__Create_tenant_tables.sql",           # 租户表（全局）
    "V011__Add_performance_indexes.sql",        # 全局表索引 + 租户索引工具函数
    "V015__Extend_columns_for_encryption.sql",  # 全局表字段扩展 + 租户字段扩展工具函数
    "V017__create_notification_templates_table.sql",
    "V018__create_notification_histories_table.sql",
    "V019__create_pii_access_logs_table.sql",
    "V020__create_tenant_backups_table.sql",
    "V021__create_audit_logs_table.sql",
    "V1.11__Add_exam_status_in_progress_completed.sql",  # 空脚本（版本控制）
    "V999__Insert_BDD_test_data.sql",           # 测试数据
    "R__seed_admin.sql"                         # 种子数据
)

Write-Host "步骤1：检查迁移脚本..." -ForegroundColor Yellow
Write-Host ""

$allFiles = Get-ChildItem -Path $migrationDir -Filter "*.sql"

Write-Host "   找到 $($allFiles.Count) 个SQL文件" -ForegroundColor Gray
Write-Host ""

$disabledCount = 0
$keptCount = 0
$unknownCount = 0

foreach ($file in $allFiles) {
    if ($scriptsToDisable -contains $file.Name) {
        Write-Host "   ❌ $($file.Name) - 将被禁用（业务表迁移）" -ForegroundColor Red
        $disabledCount++
    } elseif ($scriptsToKeep -contains $file.Name) {
        Write-Host "   ✅ $($file.Name) - 保留（全局表迁移）" -ForegroundColor Green
        $keptCount++
    } else {
        Write-Host "   ⚠️  $($file.Name) - 未分类" -ForegroundColor Yellow
        $unknownCount++
    }
}

Write-Host ""
Write-Host "汇总：" -ForegroundColor Cyan
Write-Host "   将禁用: $disabledCount 个脚本" -ForegroundColor Red
Write-Host "   将保留: $keptCount 个脚本" -ForegroundColor Green
Write-Host "   未分类: $unknownCount 个脚本" -ForegroundColor Yellow
Write-Host ""

# 检查V009_1是否存在
$v009_1Path = Join-Path $migrationDir "V009_1__Fix_users_version_constraint.sql"
if (!(Test-Path $v009_1Path)) {
    Write-Host "❌ 错误：V009_1__Fix_users_version_constraint.sql 不存在" -ForegroundColor Red
    Write-Host "   请先创建此文件（只包含users表的version字段修复）" -ForegroundColor Red
    exit 1
}

Write-Host "✅ V009_1__Fix_users_version_constraint.sql 已存在" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️  警告：此操作将重命名业务表迁移脚本为.bak" -ForegroundColor Red
Write-Host "是否继续？(输入 YES 确认)" -ForegroundColor Cyan
$confirmation = Read-Host

if ($confirmation -ne "YES") {
    Write-Host "❌ 用户取消操作" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "步骤2：禁用业务表迁移脚本..." -ForegroundColor Yellow
Write-Host ""

foreach ($scriptName in $scriptsToDisable) {
    $scriptPath = Join-Path $migrationDir $scriptName
    
    if (Test-Path $scriptPath) {
        $bakPath = $scriptPath + ".bak"
        
        # 如果.bak已存在，先删除
        if (Test-Path $bakPath) {
            Remove-Item $bakPath -Force
        }
        
        # 重命名为.bak
        Rename-Item -Path $scriptPath -NewName ($scriptName + ".bak")
        Write-Host "   ✅ $scriptName -> $scriptName.bak" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $scriptName - 文件不存在" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "步骤3：验证结果..." -ForegroundColor Yellow
Write-Host ""

$remainingFiles = Get-ChildItem -Path $migrationDir -Filter "V*.sql" | Sort-Object Name

Write-Host "   剩余的迁移脚本：" -ForegroundColor Gray
foreach ($file in $remainingFiles) {
    if ($scriptsToKeep -contains $file.Name) {
        Write-Host "   ✅ $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $($file.Name) - 未在保留列表中" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "说明：" -ForegroundColor Yellow
Write-Host "1. 业务表迁移脚本已被禁用（重命名为.bak）" -ForegroundColor Gray
Write-Host "2. 业务表应该只在tenant schema中创建（通过db/tenant-migration）" -ForegroundColor Gray
Write-Host "3. Public schema只保留全局表（tenants, users, audit_logs等）" -ForegroundColor Gray
Write-Host "4. V009已拆分为V009_1（只包含users表的version字段修复）" -ForegroundColor Gray
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 清理Flyway历史记录（删除已禁用脚本的记录）" -ForegroundColor Gray
Write-Host "2. 重新编译项目: mvn clean install -DskipTests" -ForegroundColor Gray
Write-Host "3. 启动后端服务: cd exam-bootstrap && mvn spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "清理Flyway历史的SQL：" -ForegroundColor Cyan
Write-Host @"
DELETE FROM public.flyway_schema_history 
WHERE version IN ('001', '002', '003', '004', '005', '006', '007', '008', '009', '011', '012', '013', '014', '016', '1.11');
"@ -ForegroundColor Gray
Write-Host ""

