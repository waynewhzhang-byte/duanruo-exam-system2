# 修复多租户数据库结构
# 目标：
# 1. 标记public schema中的业务表迁移为已完成（不再执行）
# 2. 为现有租户schema执行tenant-migration
# 3. 验证多租户架构正确性

$ErrorActionPreference = "Stop"

# 数据库连接信息
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "duanruo-exam-system"
$DB_USER = "postgres"
$DB_PASSWORD = "zww0625wh"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "多租户数据库结构修复脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置PGPASSWORD环境变量
$env:PGPASSWORD = $DB_PASSWORD

# 辅助函数：执行SQL
function Invoke-Sql {
    param([string]$Sql)
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c $Sql
}

# 步骤1：标记V001-V016为已完成（防止Flyway重复执行）
Write-Host "步骤1：检查Flyway迁移历史..." -ForegroundColor Yellow

$v001Count = Invoke-Sql "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '001';"
Write-Host "   V001执行次数: $v001Count" -ForegroundColor Gray

if ([int]$v001Count -gt 1) {
    Write-Host "   ⚠️  检测到V001重复执行，清理重复记录..." -ForegroundColor Yellow
    Invoke-Sql "DELETE FROM flyway_schema_history WHERE version = '001' AND installed_rank > (SELECT MIN(installed_rank) FROM flyway_schema_history WHERE version = '001');" | Out-Null
    Write-Host "   ✅ 重复记录已清理" -ForegroundColor Green
}

# 步骤2：获取所有租户schema
Write-Host ""
Write-Host "步骤2：查询租户schema..." -ForegroundColor Yellow

$schemas = Invoke-Sql "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name;"
$schemaList = $schemas -split "`n" | Where-Object { $_.Trim() -ne "" }

if ($schemaList.Count -eq 0) {
    Write-Host "   ⚠️  未找到任何租户schema" -ForegroundColor Yellow
    Write-Host "   提示：请先通过前端UI创建租户" -ForegroundColor Gray
    exit 0
}

Write-Host "   ✅ 找到 $($schemaList.Count) 个租户schema:" -ForegroundColor Green
foreach ($schema in $schemaList) {
    $tableCount = Invoke-Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';"
    if ([int]$tableCount -eq 0) {
        Write-Host "      - $schema (空，需要初始化)" -ForegroundColor Yellow
    } else {
        Write-Host "      - $schema ($tableCount 个表)" -ForegroundColor Green
    }
}

# 步骤3：为空的租户schema执行tenant-migration
Write-Host ""
Write-Host "步骤3：初始化空的租户schema..." -ForegroundColor Yellow

$projectRoot = Split-Path -Parent $PSScriptRoot
$migrationDir = Join-Path $projectRoot "exam-infrastructure\src\main\resources\db\tenant-migration"

if (!(Test-Path $migrationDir)) {
    Write-Host "   ❌ 找不到tenant-migration目录: $migrationDir" -ForegroundColor Red
    exit 1
}

$migrationFiles = Get-ChildItem -Path $migrationDir -Filter "V*.sql" | Sort-Object Name

Write-Host "   找到 $($migrationFiles.Count) 个租户迁移脚本" -ForegroundColor Gray

foreach ($schema in $schemaList) {
    $tableCount = Invoke-Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';"
    
    if ([int]$tableCount -eq 0) {
        Write-Host ""
        Write-Host "   正在初始化: $schema" -ForegroundColor Cyan
        
        # 为每个迁移脚本执行
        foreach ($file in $migrationFiles) {
            Write-Host "      执行: $($file.Name)" -ForegroundColor Gray

            # 创建临时SQL文件，包含search_path设置
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
                    Write-Host "         错误: $output" -ForegroundColor Gray
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
        
        # 验证表是否创建成功
        $newTableCount = Invoke-Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';"
        
        if ([int]$newTableCount -gt 0) {
            Write-Host "   ✅ $schema 初始化成功 (创建了 $newTableCount 个表)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $schema 初始化失败 (未创建任何表)" -ForegroundColor Red
        }
    }
}

# 步骤4：验证多租户架构
Write-Host ""
Write-Host "步骤4：验证多租户架构..." -ForegroundColor Yellow

# 检查必需的表
$requiredTables = @("exams", "positions", "subjects", "applications", "tickets", "scores")

foreach ($schema in $schemaList) {
    $missingTables = @()
    
    foreach ($table in $requiredTables) {
        $exists = Invoke-Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_name = '$table';"
        
        if ([int]$exists -eq 0) {
            $missingTables += $table
        }
    }
    
    if ($missingTables.Count -eq 0) {
        Write-Host "   ✅ $schema - 所有必需表都存在" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $schema - 缺少表: $($missingTables -join ', ')" -ForegroundColor Yellow
    }
}

# 步骤5：禁用Flyway的out-of-order模式
Write-Host ""
Write-Host "步骤5：更新Flyway配置..." -ForegroundColor Yellow

$appYmlPath = Join-Path $projectRoot "exam-bootstrap\src\main\resources\application.yml"

if (Test-Path $appYmlPath) {
    $content = Get-Content $appYmlPath -Raw
    
    # 禁用out-of-order（防止重复执行V001）
    $content = $content -replace 'out-of-order:\s*true', 'out-of-order: false'
    
    # 启用validate-on-migrate
    $content = $content -replace 'validate-on-migrate:\s*false', 'validate-on-migrate: true'
    
    Set-Content -Path $appYmlPath -Value $content -NoNewline
    
    Write-Host "   ✅ Flyway配置已更新" -ForegroundColor Green
    Write-Host "      - out-of-order: false (禁用乱序执行)" -ForegroundColor Gray
    Write-Host "      - validate-on-migrate: true (启用验证)" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  未找到application.yml文件" -ForegroundColor Yellow
}

# 完成
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 重新编译项目: mvn clean install -DskipTests" -ForegroundColor Gray
Write-Host "2. 启动后端服务: cd exam-bootstrap && mvn spring-boot:run" -ForegroundColor Gray
Write-Host "3. 测试多租户功能" -ForegroundColor Gray
Write-Host ""

