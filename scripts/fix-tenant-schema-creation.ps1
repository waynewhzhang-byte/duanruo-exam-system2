# 修复租户Schema创建问题的脚本
# 1. 检查已创建的租户
# 2. 为缺少Schema的租户创建Schema
# 3. 运行Flyway迁移创建业务表

param(
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "zww0625wh",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复租户Schema创建问题" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量
$env:PGPASSWORD = $DatabasePassword

try {
    # 1. 获取所有租户
    Write-Host "步骤1: 检查数据库中的租户..." -ForegroundColor Cyan
    $tenantsSql = "SELECT id, name, code, schema_name, status FROM tenants ORDER BY created_at DESC;"
    $tenants = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c $tenantsSql 2>&1
    
    Write-Host $tenants
    Write-Host ""
    
    # 2. 检查每个租户的Schema是否存在
    Write-Host "步骤2: 检查每个租户的Schema..." -ForegroundColor Cyan
    
    $tenantCodesSql = "SELECT code, schema_name FROM tenants;"
    $tenantData = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -F "|" -c $tenantCodesSql 2>&1
    
    $missingSchemas = @()
    
    foreach ($line in $tenantData) {
        if ($line.Trim() -eq "") { continue }
        
        $parts = $line -split "\|"
        if ($parts.Length -lt 2) { continue }
        
        $code = $parts[0].Trim()
        $schemaName = $parts[1].Trim()
        
        Write-Host "检查租户: $code (Schema: $schemaName)" -ForegroundColor Yellow
        
        $checkSql = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '$schemaName');"
        $exists = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $checkSql 2>&1
        
        if ($exists.Trim() -ne "t") {
            Write-Host "  ✗ Schema不存在: $schemaName" -ForegroundColor Red
            $missingSchemas += @{
                Code = $code
                SchemaName = $schemaName
            }
        } else {
            Write-Host "  ✓ Schema存在: $schemaName" -ForegroundColor Green
            
            # 检查Schema中是否有表
            $tablesSql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schemaName' AND table_type = 'BASE TABLE';"
            $tableCount = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -t -A -c $tablesSql 2>&1
            
            if ([int]$tableCount.Trim() -eq 0) {
                Write-Host "  ⚠ Schema中没有表，需要运行Flyway迁移" -ForegroundColor Yellow
                $missingSchemas += @{
                    Code = $code
                    SchemaName = $schemaName
                    NeedsMigration = $true
                }
            } else {
                Write-Host "  ✓ Schema中有 $($tableCount.Trim()) 个表" -ForegroundColor Green
            }
        }
    }
    
    Write-Host ""
    
    # 3. 为缺少Schema的租户创建Schema
    if ($missingSchemas.Count -gt 0) {
        Write-Host "步骤3: 为缺少Schema的租户创建Schema..." -ForegroundColor Cyan
        
        foreach ($missing in $missingSchemas) {
            $schemaName = $missing.SchemaName
            $quotedSchemaName = "`"$schemaName`""
            
            Write-Host "创建Schema: $schemaName" -ForegroundColor Yellow
            
            $createSql = "CREATE SCHEMA IF NOT EXISTS $quotedSchemaName;"
            $result = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c $createSql 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Schema创建成功: $schemaName" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Schema创建失败: $result" -ForegroundColor Red
            }
        }
        
        Write-Host ""
    } else {
        Write-Host "✓ 所有租户的Schema都已存在" -ForegroundColor Green
        Write-Host ""
    }
    
    # 4. 提示运行Flyway迁移
    Write-Host "步骤4: 运行Flyway迁移创建业务表..." -ForegroundColor Cyan
    Write-Host "注意: 需要编译项目并使用Maven Flyway插件运行迁移" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "运行以下命令为租户Schema创建业务表:" -ForegroundColor Yellow
    Write-Host "  cd exam-infrastructure" -ForegroundColor Gray
    Write-Host "  mvn flyway:migrate -Dflyway.schemas=<schema_name> -Dflyway.locations=classpath:db/tenant-migration" -ForegroundColor Gray
    Write-Host ""
    Write-Host "或者使用后端API触发Schema创建（如果事件监听器已修复）" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "完成!" -ForegroundColor Green
    
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    exit 1
} finally {
    $env:PGPASSWORD = $null
}

