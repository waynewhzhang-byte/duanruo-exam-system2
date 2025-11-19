# 分析所有迁移脚本，确定哪些是全局表，哪些是业务表
# 输出详细的分析报告

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "迁移脚本分析报告" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationDir = "exam-infrastructure\src\main\resources\db\migration"

if (!(Test-Path $migrationDir)) {
    Write-Host "❌ 找不到迁移目录: $migrationDir" -ForegroundColor Red
    exit 1
}

# 定义：全局表（应该在public schema中）
$globalTables = @(
    "users",                    # 用户表
    "tenants",                  # 租户表
    "user_tenant_roles",        # 用户-租户-角色关联表
    "audit_logs",               # 审计日志
    "tenant_backups",           # 租户备份
    "pii_access_logs",          # 个人信息访问日志
    "notification_templates",   # 通知模板
    "notification_histories"    # 通知历史
)

# 定义：业务表（应该在tenant schema中）
$businessTables = @(
    "exams",                    # 考试表
    "positions",                # 岗位表
    "subjects",                 # 科目表
    "applications",             # 报名申请表
    "reviews",                  # 审核记录表
    "tickets",                  # 准考证表
    "scores",                   # 成绩表
    "files",                    # 文件表
    "payment_orders",           # 支付订单表
    "exam_scores",              # 考试成绩表
    "seat_assignments",         # 座位分配表
    "venues",                   # 考场表
    "exam_admins",              # 考试管理员表
    "exam_reviewers",           # 审核员表
    "review_tasks",             # 审核任务表
    "ticket_number_rules",      # 准考证号规则表
    "ticket_sequences",         # 准考证号序列表
    "allocation_batches",       # 分配批次表
    "application_audit_logs",   # 申请审计日志表
    "outbox_events"             # 事件发件箱表
)

$allFiles = Get-ChildItem -Path $migrationDir -Filter "V*.sql" | Sort-Object Name

Write-Host "分析 $($allFiles.Count) 个迁移脚本..." -ForegroundColor Yellow
Write-Host ""

$analysisResults = @()

foreach ($file in $allFiles) {
    Write-Host "分析: $($file.Name)" -ForegroundColor Cyan
    
    # 读取文件内容
    $content = Get-Content $file.FullName -Raw
    
    # 提取CREATE TABLE语句中的表名
    $tableMatches = [regex]::Matches($content, 'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    $tablesInScript = @()
    foreach ($match in $tableMatches) {
        $tableName = $match.Groups[1].Value
        if ($tableName -ne "IF" -and $tableName -ne "NOT" -and $tableName -ne "EXISTS") {
            $tablesInScript += $tableName
        }
    }
    
    # 提取ALTER TABLE语句中的表名
    $alterMatches = [regex]::Matches($content, 'ALTER\s+TABLE\s+(\w+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    foreach ($match in $alterMatches) {
        $tableName = $match.Groups[1].Value
        if ($tablesInScript -notcontains $tableName) {
            $tablesInScript += $tableName
        }
    }
    
    # 分类
    $globalTablesFound = @()
    $businessTablesFound = @()
    $unknownTables = @()
    
    foreach ($table in $tablesInScript) {
        if ($globalTables -contains $table) {
            $globalTablesFound += $table
        } elseif ($businessTables -contains $table) {
            $businessTablesFound += $table
        } else {
            $unknownTables += $table
        }
    }
    
    # 判断脚本类型
    $scriptType = "UNKNOWN"
    $shouldKeep = $false
    
    if ($globalTablesFound.Count -gt 0 -and $businessTablesFound.Count -eq 0) {
        $scriptType = "GLOBAL_ONLY"
        $shouldKeep = $true
        Write-Host "   ✅ 类型: 全局表迁移" -ForegroundColor Green
    } elseif ($businessTablesFound.Count -gt 0 -and $globalTablesFound.Count -eq 0) {
        $scriptType = "BUSINESS_ONLY"
        $shouldKeep = $false
        Write-Host "   ❌ 类型: 业务表迁移" -ForegroundColor Red
    } elseif ($globalTablesFound.Count -gt 0 -and $businessTablesFound.Count -gt 0) {
        $scriptType = "MIXED"
        $shouldKeep = $null  # 需要手动决定
        Write-Host "   ⚠️  类型: 混合（包含全局表和业务表）" -ForegroundColor Yellow
    } else {
        $scriptType = "UNKNOWN"
        $shouldKeep = $null
        Write-Host "   ⚠️  类型: 未知" -ForegroundColor Yellow
    }
    
    # 显示详细信息
    if ($globalTablesFound.Count -gt 0) {
        Write-Host "      全局表: $($globalTablesFound -join ', ')" -ForegroundColor Green
    }
    if ($businessTablesFound.Count -gt 0) {
        Write-Host "      业务表: $($businessTablesFound -join ', ')" -ForegroundColor Red
    }
    if ($unknownTables.Count -gt 0) {
        Write-Host "      未知表: $($unknownTables -join ', ')" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # 保存分析结果
    $analysisResults += [PSCustomObject]@{
        FileName = $file.Name
        Type = $scriptType
        ShouldKeep = $shouldKeep
        GlobalTables = $globalTablesFound -join ', '
        BusinessTables = $businessTablesFound -join ', '
        UnknownTables = $unknownTables -join ', '
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "分析汇总" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$globalOnlyCount = ($analysisResults | Where-Object { $_.Type -eq "GLOBAL_ONLY" }).Count
$businessOnlyCount = ($analysisResults | Where-Object { $_.Type -eq "BUSINESS_ONLY" }).Count
$mixedCount = ($analysisResults | Where-Object { $_.Type -eq "MIXED" }).Count
$unknownCount = ($analysisResults | Where-Object { $_.Type -eq "UNKNOWN" }).Count

Write-Host "全局表迁移: $globalOnlyCount 个（应保留）" -ForegroundColor Green
Write-Host "业务表迁移: $businessOnlyCount 个（应禁用）" -ForegroundColor Red
Write-Host "混合迁移: $mixedCount 个（需要手动处理）" -ForegroundColor Yellow
Write-Host "未知迁移: $unknownCount 个（需要手动检查）" -ForegroundColor Yellow
Write-Host ""

# 显示需要手动处理的脚本
$needsManualReview = $analysisResults | Where-Object { $_.Type -eq "MIXED" -or $_.Type -eq "UNKNOWN" }

if ($needsManualReview.Count -gt 0) {
    Write-Host "需要手动检查的脚本：" -ForegroundColor Yellow
    foreach ($result in $needsManualReview) {
        Write-Host "   - $($result.FileName)" -ForegroundColor Yellow
        if ($result.GlobalTables) {
            Write-Host "     全局表: $($result.GlobalTables)" -ForegroundColor Green
        }
        if ($result.BusinessTables) {
            Write-Host "     业务表: $($result.BusinessTables)" -ForegroundColor Red
        }
        if ($result.UnknownTables) {
            Write-Host "     未知表: $($result.UnknownTables)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# 导出详细报告到CSV
$reportPath = "migration-analysis-report.csv"
$analysisResults | Export-Csv -Path $reportPath -NoTypeInformation -Encoding UTF8

Write-Host "✅ 详细报告已导出到: $reportPath" -ForegroundColor Green
Write-Host ""

# 显示建议
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "建议" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 保留全局表迁移脚本（$globalOnlyCount 个）" -ForegroundColor Green
Write-Host "2. 禁用业务表迁移脚本（$businessOnlyCount 个）" -ForegroundColor Red
Write-Host "3. 手动检查混合/未知脚本（$($mixedCount + $unknownCount) 个）" -ForegroundColor Yellow
Write-Host ""
Write-Host "对于混合脚本，建议：" -ForegroundColor Yellow
Write-Host "   - 拆分为两个脚本：一个用于全局表，一个用于业务表" -ForegroundColor Gray
Write-Host "   - 或者只保留全局表部分，业务表部分移到tenant-migration" -ForegroundColor Gray
Write-Host ""

