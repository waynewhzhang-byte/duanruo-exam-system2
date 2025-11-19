# 手动为租户创建Schema的脚本
# 用于修复已创建但Schema未生成的租户

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

Write-Host "开始为租户创建Schema: $TenantCode" -ForegroundColor Green

# 构建Schema名称
$schemaName = "tenant_$TenantCode"

Write-Host "Schema名称: $schemaName" -ForegroundColor Yellow

# 构建连接字符串
$connectionString = "host=$DatabaseHost port=$DatabasePort dbname=$DatabaseName user=$DatabaseUser password=$DatabasePassword"

try {
    # 使用psql执行SQL
    $createSchemaSql = "CREATE SCHEMA IF NOT EXISTS $schemaName;"
    
    Write-Host "执行SQL: $createSchemaSql" -ForegroundColor Cyan
    
    $env:PGPASSWORD = $DatabasePassword
    $result = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c $createSchemaSql 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Schema创建成功: $schemaName" -ForegroundColor Green
        
        # 检查Schema是否存在
        $checkSql = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '$schemaName');"
        $checkResult = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -c $checkSql 2>&1
        
        if ($checkResult -match "t") {
            Write-Host "Schema验证成功: $schemaName 已存在" -ForegroundColor Green
            
            # 列出Schema中的表
            $tablesSql = "SELECT table_name FROM information_schema.tables WHERE table_schema = '$schemaName' ORDER BY table_name;"
            Write-Host "`nSchema中的表:" -ForegroundColor Yellow
            & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c $tablesSql
            
            Write-Host "`n注意: 如果Schema中没有表，需要运行Flyway迁移来创建业务表" -ForegroundColor Yellow
            Write-Host "迁移脚本位置: exam-infrastructure/src/main/resources/db/tenant-migration/" -ForegroundColor Yellow
        } else {
            Write-Host "警告: Schema创建后验证失败" -ForegroundColor Red
        }
    } else {
        Write-Host "Schema创建失败: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    exit 1
} finally {
    $env:PGPASSWORD = $null
}

Write-Host "`n完成!" -ForegroundColor Green

