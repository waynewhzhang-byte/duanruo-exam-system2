# 清理不完整的租户并更新正确租户的数据结构
# 目标：
# 1. 删除结构不完整的租户（schema + tenants表记录）
# 2. 确保正确租户（tenant_company_a, tenant_company_b）的数据结构是最新的

$ErrorActionPreference = "Stop"

$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "duanruo-exam-system"
$DB_USER = "postgres"
$DB_PASSWORD = "zww0625wh"

$env:PGPASSWORD = $DB_PASSWORD

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "清理不完整租户并更新数据结构" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 辅助函数：执行SQL
function Invoke-Sql {
    param([string]$Sql)
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c $Sql
}

# 定义：完整租户应该有的表
$requiredTables = @("exams", "positions", "subjects", "applications", "reviews", "tickets", "scores", "files")

Write-Host "步骤1：检查所有租户schema的完整性..." -ForegroundColor Yellow
Write-Host ""

# 获取所有租户schema
$schemas = Invoke-Sql "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name;"
$schemaList = $schemas -split "`n" | Where-Object { $_.Trim() -ne "" }

$incompleteTenants = @()
$completeTenants = @()

foreach ($schema in $schemaList) {
    # 获取该schema中的表
    $tables = Invoke-Sql "SELECT table_name FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';"
    $tableList = $tables -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    # 检查是否包含所有必需的表
    $missingTables = @()
    foreach ($requiredTable in $requiredTables) {
        if ($tableList -notcontains $requiredTable) {
            $missingTables += $requiredTable
        }
    }
    
    if ($missingTables.Count -gt 0) {
        $incompleteTenants += $schema
        Write-Host "   ❌ $schema - 不完整（缺少: $($missingTables -join ', ')）" -ForegroundColor Red
    } else {
        $completeTenants += $schema
        Write-Host "   ✅ $schema - 完整（$($tableList.Count) 个表）" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "汇总：" -ForegroundColor Cyan
Write-Host "   完整租户: $($completeTenants.Count) 个" -ForegroundColor Green
Write-Host "   不完整租户: $($incompleteTenants.Count) 个" -ForegroundColor Red
Write-Host ""

# 步骤2：删除不完整的租户
if ($incompleteTenants.Count -gt 0) {
    Write-Host "步骤2：删除不完整的租户..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "将要删除的租户schema：" -ForegroundColor Red
    foreach ($schema in $incompleteTenants) {
        Write-Host "   - $schema" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "⚠️  警告：此操作将永久删除这些租户的schema和数据！" -ForegroundColor Red
    Write-Host "是否继续删除？(输入 YES 确认)" -ForegroundColor Cyan
    $confirmation = Read-Host
    
    if ($confirmation -ne "YES") {
        Write-Host "❌ 用户取消操作" -ForegroundColor Red
        exit 0
    }
    
    Write-Host ""
    foreach ($schema in $incompleteTenants) {
        Write-Host "   删除schema: $schema" -ForegroundColor Gray
        
        try {
            # 删除schema（CASCADE删除所有对象）
            Invoke-Sql "DROP SCHEMA IF EXISTS ""$schema"" CASCADE;" | Out-Null
            
            # 从tenants表中删除记录
            Invoke-Sql "DELETE FROM public.tenants WHERE schema_name = '$schema';" | Out-Null
            
            Write-Host "   ✅ $schema 已删除" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ $schema 删除失败: $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
} else {
    Write-Host "步骤2：无需删除（没有不完整的租户）" -ForegroundColor Green
    Write-Host ""
}

# 步骤3：更新完整租户的数据结构
if ($completeTenants.Count -gt 0) {
    Write-Host "步骤3：更新完整租户的数据结构..." -ForegroundColor Yellow
    Write-Host ""
    
    $projectRoot = Split-Path -Parent $PSScriptRoot
    $migrationDir = Join-Path $projectRoot "exam-infrastructure\src\main\resources\db\tenant-migration"
    
    if (!(Test-Path $migrationDir)) {
        Write-Host "   ❌ 找不到tenant-migration目录: $migrationDir" -ForegroundColor Red
        exit 1
    }
    
    $migrationFiles = Get-ChildItem -Path $migrationDir -Filter "V*.sql" | Sort-Object Name
    
    Write-Host "   找到 $($migrationFiles.Count) 个迁移脚本" -ForegroundColor Gray
    Write-Host ""
    
    foreach ($schema in $completeTenants) {
        Write-Host "   更新租户: $schema" -ForegroundColor Cyan
        
        # 检查该schema的flyway_schema_history
        $flywayHistory = Invoke-Sql "SELECT version FROM ""$schema"".flyway_schema_history ORDER BY installed_rank;" 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "      ⚠️  该schema没有flyway_schema_history表，将执行所有迁移" -ForegroundColor Yellow
            $executedVersions = @()
        } else {
            $executedVersions = $flywayHistory -split "`n" | Where-Object { $_.Trim() -ne "" }
            Write-Host "      已执行的版本: $($executedVersions -join ', ')" -ForegroundColor Gray
        }
        
        # 为每个迁移脚本执行（如果未执行过）
        foreach ($file in $migrationFiles) {
            # 提取版本号（例如：V001 -> 001）
            if ($file.Name -match '^V(\d+)__') {
                $version = $matches[1]
            } else {
                Write-Host "      ⚠️  无法解析版本号: $($file.Name)" -ForegroundColor Yellow
                continue
            }
            
            # 检查是否已执行
            if ($executedVersions -contains $version) {
                Write-Host "      ⏭️  $($file.Name) - 已执行，跳过" -ForegroundColor Gray
                continue
            }
            
            Write-Host "      执行: $($file.Name)" -ForegroundColor Gray
            
            # 创建临时SQL文件
            $tempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
            
            try {
                # 读取原始SQL内容
                $sqlContent = Get-Content $file.FullName -Raw
                
                # 创建包含search_path的完整SQL
                $fullSql = "SET search_path TO ""$schema"", public;`n$sqlContent"
                
                # 写入临时文件
                Set-Content -Path $tempSqlFile -Value $fullSql -Encoding UTF8
                
                # 使用psql执行临时文件
                $output = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $tempSqlFile 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "      ✅ $($file.Name) 执行成功" -ForegroundColor Green
                } else {
                    Write-Host "      ❌ $($file.Name) 执行失败" -ForegroundColor Red
                    Write-Host "         错误: $($output | Select-Object -First 3)" -ForegroundColor Gray
                }
            } catch {
                Write-Host "      ❌ $($file.Name) 执行异常: $_" -ForegroundColor Red
            } finally {
                # 删除临时文件
                if (Test-Path $tempSqlFile) {
                    Remove-Item $tempSqlFile -Force
                }
            }
        }
        
        Write-Host ""
    }
} else {
    Write-Host "步骤3：无完整租户需要更新" -ForegroundColor Yellow
    Write-Host ""
}

# 步骤4：最终验证
Write-Host "步骤4：最终验证..." -ForegroundColor Yellow
Write-Host ""

$remainingSchemas = Invoke-Sql "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name;"
$remainingList = $remainingSchemas -split "`n" | Where-Object { $_.Trim() -ne "" }

Write-Host "   剩余租户schema：" -ForegroundColor Gray
foreach ($schema in $remainingList) {
    $tableCount = Invoke-Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';"
    Write-Host "   - $schema ($tableCount 个表)" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 重新编译项目: mvn clean install -DskipTests" -ForegroundColor Gray
Write-Host "2. 启动后端服务: cd exam-bootstrap && mvn spring-boot:run" -ForegroundColor Gray
Write-Host "3. 测试多租户功能" -ForegroundColor Gray
Write-Host ""

