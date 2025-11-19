# 修复public schema的迁移脚本
# 目标：将创建业务表的迁移脚本重命名为.bak，防止Flyway执行

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复Public Schema迁移脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationDir = "exam-infrastructure\src\main\resources\db\migration"

if (!(Test-Path $migrationDir)) {
    Write-Host "❌ 找不到迁移目录: $migrationDir" -ForegroundColor Red
    exit 1
}

# 定义：应该禁用的迁移脚本（创建业务表的）
$scriptsToDisable = @(
    "V001__Create_initial_tables.sql",
    "V002__Create_review_tasks.sql",
    "V003__Create_venues_and_seating.sql",
    "V004__Create_ticket_numbering.sql",
    "V005__add_rules_config_to_exams.sql",
    "V006__create_exam_reviewers.sql",
    "V007__Create_exam_admin_and_scores.sql",
    "V008__Add_slug_to_exams.sql",
    "V009__Fix_version_constraints.sql",
    "V011__Add_performance_indexes.sql",
    "V012__Create_tickets_table.sql",
    "V013__Create_payment_orders_table.sql",
    "V014__Enhance_ticket_number_rules.sql",
    "V015__Extend_columns_for_encryption.sql",
    "V016__Extend_public_tickets_encrypted_columns.sql",
    "V1.11__Add_exam_status_in_progress_completed.sql"
)

# 定义：应该保留的迁移脚本（创建全局表的）
$scriptsToKeep = @(
    "V002_1__Create_user_tables.sql",           # 用户表（全局）
    "V010__Create_tenant_tables.sql",           # 租户表（全局）
    "V017__create_notification_templates_table.sql",
    "V018__create_notification_histories_table.sql",
    "V019__create_pii_access_logs_table.sql",
    "V020__create_tenant_backups_table.sql",
    "V021__create_audit_logs_table.sql",
    "R__seed_admin.sql",                        # 种子数据
    "V999__Insert_BDD_test_data.sql"            # 测试数据
)

Write-Host "步骤1：检查迁移脚本..." -ForegroundColor Yellow
Write-Host ""

$allFiles = Get-ChildItem -Path $migrationDir -Filter "*.sql"

Write-Host "   找到 $($allFiles.Count) 个SQL文件" -ForegroundColor Gray
Write-Host ""

$disabledCount = 0
$keptCount = 0

foreach ($file in $allFiles) {
    if ($scriptsToDisable -contains $file.Name) {
        Write-Host "   ❌ $($file.Name) - 将被禁用（业务表迁移）" -ForegroundColor Red
        $disabledCount++
    } elseif ($scriptsToKeep -contains $file.Name) {
        Write-Host "   ✅ $($file.Name) - 保留（全局表迁移）" -ForegroundColor Green
        $keptCount++
    } else {
        Write-Host "   ⚠️  $($file.Name) - 未分类" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "汇总：" -ForegroundColor Cyan
Write-Host "   将禁用: $disabledCount 个脚本" -ForegroundColor Red
Write-Host "   将保留: $keptCount 个脚本" -ForegroundColor Green
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

$remainingFiles = Get-ChildItem -Path $migrationDir -Filter "V*.sql"

Write-Host "   剩余的迁移脚本：" -ForegroundColor Gray
foreach ($file in $remainingFiles) {
    Write-Host "   - $($file.Name)" -ForegroundColor Green
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
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 重新编译项目: mvn clean install -DskipTests" -ForegroundColor Gray
Write-Host "2. 启动后端服务: cd exam-bootstrap && mvn spring-boot:run" -ForegroundColor Gray
Write-Host ""

