# 为租户Schema运行Flyway迁移脚本
# 用于为已创建的租户Schema创建业务表

param(
    [Parameter(Mandatory=$true)]
    [string]$TenantCode,
    
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "zww0625wh",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "为租户Schema运行Flyway迁移" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 构建Schema名称
$schemaName = "tenant_$TenantCode"
$quotedSchemaName = "`"$schemaName`""

Write-Host "租户代码: $TenantCode" -ForegroundColor Yellow
Write-Host "Schema名称: $schemaName" -ForegroundColor Yellow
Write-Host ""

# 设置环境变量
$env:PGPASSWORD = $DatabasePassword

try {
    # 1. 检查Schema是否存在
    Write-Host "步骤1: 检查Schema是否存在..." -ForegroundColor Cyan
    $checkSql = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '$schemaName');"
    $checkResult = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $checkSql 2>&1
    
    if ($checkResult.Trim() -ne "t") {
        Write-Host "错误: Schema不存在: $schemaName" -ForegroundColor Red
        Write-Host "请先创建Schema: CREATE SCHEMA IF NOT EXISTS $quotedSchemaName;" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✓ Schema存在: $schemaName" -ForegroundColor Green
    Write-Host ""
    
    # 2. 检查Flyway迁移历史表是否存在
    Write-Host "步骤2: 检查Flyway迁移历史..." -ForegroundColor Cyan
    $flywayTableSql = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = '$schemaName' AND table_name = 'flyway_schema_history');"
    $flywayTableExists = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $flywayTableSql 2>&1
    
    if ($flywayTableExists.Trim() -eq "t") {
        Write-Host "✓ Flyway迁移历史表已存在" -ForegroundColor Green
        
        # 检查已应用的迁移
        $migrationsSql = "SELECT version, description, type, installed_on FROM ${quotedSchemaName}.flyway_schema_history ORDER BY installed_rank;"
        Write-Host "已应用的迁移:" -ForegroundColor Yellow
        & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c $migrationsSql
    } else {
        Write-Host "ℹ Flyway迁移历史表不存在，将创建基线" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # 3. 运行Flyway迁移
    Write-Host "步骤3: 运行Flyway迁移..." -ForegroundColor Cyan
    Write-Host "注意: 这需要Java和Maven环境，并且需要编译项目" -ForegroundColor Yellow
    Write-Host ""
    
    # 切换到项目根目录
    $projectRoot = Split-Path -Parent $PSScriptRoot
    Push-Location $projectRoot
    
    # 构建Flyway命令
    $flywayConfig = @{
        url = "jdbc:postgresql://${DatabaseHost}:${DatabasePort}/${DatabaseName}"
        user = $DatabaseUser
        password = $DatabasePassword
        schemas = $schemaName
        locations = "filesystem:exam-infrastructure/src/main/resources/db/tenant-migration"
        baselineOnMigrate = "true"
    }
    
    Write-Host "Flyway配置:" -ForegroundColor Yellow
    Write-Host "  URL: $($flywayConfig.url)" -ForegroundColor Gray
    Write-Host "  Schema: $schemaName" -ForegroundColor Gray
    Write-Host "  Locations: $($flywayConfig.locations)" -ForegroundColor Gray
    Write-Host ""
    
    # 检查Flyway是否可用
    $flywayPath = Get-Command flyway -ErrorAction SilentlyContinue
    if (-not $flywayPath) {
        Write-Host "警告: Flyway命令行工具未找到" -ForegroundColor Yellow
        Write-Host "建议: 使用Maven Flyway插件运行迁移" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "或者手动执行SQL脚本:" -ForegroundColor Yellow
        Write-Host "  psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -f exam-infrastructure/src/main/resources/db/tenant-migration/V001__Create_tenant_business_tables.sql" -ForegroundColor Gray
        Write-Host ""
        
        # 提供手动执行SQL的选项
        $manual = Read-Host "是否手动执行SQL脚本? (y/n)"
        if ($manual -eq "y") {
            Write-Host "请手动执行以下命令:" -ForegroundColor Yellow
            Write-Host "  SET search_path TO $quotedSchemaName, public;" -ForegroundColor Gray
            Write-Host "  然后执行 exam-infrastructure/src/main/resources/db/tenant-migration/ 目录下的所有SQL文件" -ForegroundColor Gray
        }
    } else {
        # 构建Flyway命令参数
        $flywayArgs = @(
            "migrate"
            "-url=$($flywayConfig.url)"
            "-user=$($flywayConfig.user)"
            "-password=$($flywayConfig.password)"
            "-schemas=$schemaName"
            "-locations=$($flywayConfig.locations)"
            "-baselineOnMigrate=$($flywayConfig.baselineOnMigrate)"
        )
        
        Write-Host "执行Flyway迁移..." -ForegroundColor Cyan
        & flyway $flywayArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Flyway迁移成功" -ForegroundColor Green
        } else {
            Write-Host "✗ Flyway迁移失败" -ForegroundColor Red
            exit 1
        }
    }
    
    # 4. 验证表是否创建成功
    Write-Host ""
    Write-Host "步骤4: 验证表是否创建成功..." -ForegroundColor Cyan
    $tablesSql = "SELECT table_name FROM information_schema.tables WHERE table_schema = '$schemaName' AND table_type = 'BASE TABLE' ORDER BY table_name;"
    $tables = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $tablesSql 2>&1
    
    if ($tables) {
        Write-Host "✓ Schema中的表:" -ForegroundColor Green
        $tables -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object {
            Write-Host "  - $($_.Trim())" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠ 警告: Schema中没有找到表" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "完成!" -ForegroundColor Green
    
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
    $env:PGPASSWORD = $null
}

