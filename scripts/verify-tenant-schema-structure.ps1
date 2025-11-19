# 验证租户Schema结构是否符合标准
# 对比新建租户Schema与标准Schema (tenant_test_company_a) 的结构

param(
    [Parameter(Mandatory=$true)]
    [string]$TenantCode,
    
    [string]$StandardSchema = "tenant_test_company_a",
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "zww0625wh",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "验证租户Schema结构" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 构建Schema名称
$schemaName = "tenant_$TenantCode"
$quotedSchemaName = "`"$schemaName`""

Write-Host "租户代码: $TenantCode" -ForegroundColor Yellow
Write-Host "Schema名称: $schemaName" -ForegroundColor Yellow
Write-Host "标准Schema: $StandardSchema" -ForegroundColor Yellow
Write-Host ""

# 设置环境变量
$env:PGPASSWORD = $DatabasePassword

try {
    # 1. 检查Schema是否存在
    Write-Host "步骤1: 检查Schema是否存在..." -ForegroundColor Cyan
    $checkSql = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '$schemaName');"
    $exists = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $checkSql 2>&1
    
    if ($exists.Trim() -ne "t") {
        Write-Host "  ✗ Schema不存在: $schemaName" -ForegroundColor Red
        Write-Host "  请先创建Schema" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "  ✓ Schema存在: $schemaName" -ForegroundColor Green
    Write-Host ""
    
    # 2. 检查标准Schema是否存在
    Write-Host "步骤2: 检查标准Schema是否存在..." -ForegroundColor Cyan
    $standardExists = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '$StandardSchema');" 2>&1
    
    if ($standardExists.Trim() -ne "t") {
        Write-Host "  ⚠ 标准Schema不存在: $StandardSchema" -ForegroundColor Yellow
        Write-Host "  将跳过对比验证" -ForegroundColor Yellow
        $skipComparison = $true
    } else {
        Write-Host "  ✓ 标准Schema存在: $StandardSchema" -ForegroundColor Green
        $skipComparison = $false
    }
    Write-Host ""
    
    # 3. 获取表列表
    Write-Host "步骤3: 获取表列表..." -ForegroundColor Cyan
    
    $tablesSql = "SELECT table_name FROM information_schema.tables WHERE table_schema = '$schemaName' AND table_type = 'BASE TABLE' AND table_name != 'flyway_schema_history' ORDER BY table_name;"
    $tables = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $tablesSql 2>&1
    $tableList = $tables -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }
    
    Write-Host "  找到 $($tableList.Count) 个业务表" -ForegroundColor Yellow
    
    # 预期的表列表（基于标准Schema）
    $expectedTables = @(
        "allocation_batches",
        "application_audit_logs",
        "applications",
        "exam_admins",
        "exam_reviewers",
        "exam_scores",
        "exams",
        "files",
        "payment_orders",
        "positions",
        "review_tasks",
        "reviews",
        "seat_assignments",
        "subjects",
        "ticket_number_rules",
        "ticket_sequences",
        "tickets",
        "venues"
    )
    
    Write-Host "  预期表数量: $($expectedTables.Count)" -ForegroundColor Yellow
    
    # 对比表列表
    $missingTables = $expectedTables | Where-Object { $tableList -notcontains $_ }
    $extraTables = $tableList | Where-Object { $expectedTables -notcontains $_ }
    
    if ($missingTables.Count -eq 0 -and $extraTables.Count -eq 0) {
        Write-Host "  ✓ 表列表完全匹配" -ForegroundColor Green
    } else {
        if ($missingTables.Count -gt 0) {
            Write-Host "  ✗ 缺少表 ($($missingTables.Count)个):" -ForegroundColor Red
            $missingTables | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
        }
        if ($extraTables.Count -gt 0) {
            Write-Host "  ⚠ 额外表 ($($extraTables.Count)个):" -ForegroundColor Yellow
            $extraTables | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
        }
    }
    Write-Host ""
    
    # 4. 检查Flyway迁移历史
    Write-Host "步骤4: 检查Flyway迁移历史..." -ForegroundColor Cyan
    
    $flywayHistorySql = "SELECT version, description FROM ${quotedSchemaName}.flyway_schema_history WHERE type = 'SQL' ORDER BY installed_rank;"
    $flywayHistory = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c $flywayHistorySql 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Flyway迁移历史:" -ForegroundColor Green
        Write-Host $flywayHistory
        
        # 检查关键迁移是否执行
        $expectedMigrations = @("002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012")
        $executedMigrations = ($flywayHistory | Select-String -Pattern "^\s+(\d+)" | ForEach-Object { $_.Matches.Groups[1].Value })
        
        $missingMigrations = $expectedMigrations | Where-Object { $executedMigrations -notcontains $_ }
        if ($missingMigrations.Count -gt 0) {
            Write-Host "  ⚠ 缺少迁移: $($missingMigrations -join ', ')" -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ 所有预期迁移都已执行" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ 无法读取Flyway迁移历史" -ForegroundColor Red
    }
    Write-Host ""
    
    # 5. 对比关键表结构（如果标准Schema存在）
    if (-not $skipComparison) {
        Write-Host "步骤5: 对比关键表结构..." -ForegroundColor Cyan
        
        $keyTables = @("exams", "applications", "positions", "subjects")
        
        foreach ($table in $keyTables) {
            Write-Host "  检查表: $table" -ForegroundColor Yellow
            
            # 获取标准Schema的表结构
            $standardColumnsSql = "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = '$StandardSchema' AND table_name = '$table' ORDER BY ordinal_position;"
            $standardColumns = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -F "|" -c $standardColumnsSql 2>&1
            
            # 获取目标Schema的表结构
            $targetColumnsSql = "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = '$schemaName' AND table_name = '$table' ORDER BY ordinal_position;"
            $targetColumns = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -F "|" -c $targetColumnsSql 2>&1
            
            if ($standardColumns -eq $targetColumns) {
                Write-Host "    ✓ 表结构匹配" -ForegroundColor Green
            } else {
                Write-Host "    ⚠ 表结构可能不匹配，请手动检查" -ForegroundColor Yellow
            }
        }
        Write-Host ""
    }
    
    # 6. 检查关键字段
    Write-Host "步骤6: 检查关键字段..." -ForegroundColor Cyan
    
    # 检查exams表的exam_start和exam_end字段（V012添加）
    $examFieldsSql = "SELECT column_name FROM information_schema.columns WHERE table_schema = '$schemaName' AND table_name = 'exams' AND column_name IN ('exam_start', 'exam_end');"
    $examFields = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $examFieldsSql 2>&1
    $examFieldsList = $examFields -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }
    
    if ($examFieldsList -contains "exam_start" -and $examFieldsList -contains "exam_end") {
        Write-Host "  ✓ exams表包含exam_start和exam_end字段" -ForegroundColor Green
    } else {
        Write-Host "  ✗ exams表缺少exam_start或exam_end字段" -ForegroundColor Red
    }
    Write-Host ""
    
    # 7. 检查外键约束
    Write-Host "步骤7: 检查外键约束..." -ForegroundColor Cyan
    
    $fkSql = "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = '$schemaName' AND constraint_type = 'FOREIGN KEY';"
    $fkCount = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $fkSql 2>&1
    
    Write-Host "  外键约束数量: $($fkCount.Trim())" -ForegroundColor Yellow
    
    if (-not $skipComparison) {
        $standardFkSql = "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = '$StandardSchema' AND constraint_type = 'FOREIGN KEY';"
        $standardFkCount = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $standardFkSql 2>&1
        
        if ($fkCount.Trim() -eq $standardFkCount.Trim()) {
            Write-Host "  ✓ 外键约束数量匹配标准Schema" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ 外键约束数量不匹配 (标准: $($standardFkCount.Trim()), 当前: $($fkCount.Trim()))" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    
    # 总结
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "验证完成" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Schema: $schemaName" -ForegroundColor Yellow
    Write-Host "业务表数量: $($tableList.Count)" -ForegroundColor Yellow
    Write-Host "预期表数量: $($expectedTables.Count)" -ForegroundColor Yellow
    
    if ($missingTables.Count -eq 0 -and $extraTables.Count -eq 0) {
        Write-Host ""
        Write-Host "✅ Schema结构符合标准！" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠ Schema结构可能不符合标准，请检查上述差异" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    exit 1
} finally {
    $env:PGPASSWORD = $null
}

