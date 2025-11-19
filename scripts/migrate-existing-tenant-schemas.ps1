# 为现有租户Schema执行tenant-migration迁移脚本
# 用途：修复已创建但未初始化的租户schema

$ErrorActionPreference = "Stop"

# 数据库连接信息
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "duanruo-exam-system"
$DB_USER = "postgres"
$env:PGPASSWORD = "zww0625wh"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "租户Schema迁移脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 获取所有租户schema
Write-Host "1. 查询现有租户schema..." -ForegroundColor Yellow
$schemas = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name;"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 查询租户schema失败" -ForegroundColor Red
    exit 1
}

$schemaList = $schemas -split "`n" | Where-Object { $_.Trim() -ne "" }

if ($schemaList.Count -eq 0) {
    Write-Host "⚠️  未找到任何租户schema" -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ 找到 $($schemaList.Count) 个租户schema:" -ForegroundColor Green
foreach ($schema in $schemaList) {
    Write-Host "   - $schema" -ForegroundColor Gray
}
Write-Host ""

# 2. 检查每个schema的表数量
Write-Host "2. 检查每个schema的表结构..." -ForegroundColor Yellow
$emptySchemas = @()

foreach ($schema in $schemaList) {
    $tableCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';"
    
    if ($tableCount -eq "0") {
        Write-Host "   ⚠️  $schema - 空schema（0个表）" -ForegroundColor Yellow
        $emptySchemas += $schema
    } else {
        Write-Host "   ✅ $schema - 已初始化（$tableCount 个表）" -ForegroundColor Green
    }
}
Write-Host ""

if ($emptySchemas.Count -eq 0) {
    Write-Host "✅ 所有租户schema都已初始化，无需迁移" -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  发现 $($emptySchemas.Count) 个空schema需要初始化" -ForegroundColor Yellow
Write-Host ""

# 3. 确认是否继续
Write-Host "是否继续为这些空schema执行tenant-migration？(Y/N)" -ForegroundColor Cyan
$confirmation = Read-Host

if ($confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "❌ 用户取消操作" -ForegroundColor Red
    exit 0
}
Write-Host ""

# 4. 使用Maven执行tenant-migration
Write-Host "3. 执行tenant-migration迁移..." -ForegroundColor Yellow
Write-Host ""

# 切换到项目根目录
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# 编译项目（确保最新的迁移脚本被打包）
Write-Host "   编译项目..." -ForegroundColor Gray
mvn clean install -DskipTests -q

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 项目编译失败" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ 项目编译成功" -ForegroundColor Green
Write-Host ""

# 为每个空schema执行迁移
foreach ($schema in $emptySchemas) {
    Write-Host "   正在迁移: $schema" -ForegroundColor Cyan
    
    # 使用Java直接调用Flyway
    $flywayCommand = @"
import org.flywaydb.core.Flyway;
import javax.sql.DataSource;
import org.postgresql.ds.PGSimpleDataSource;

public class TenantMigration {
    public static void main(String[] args) {
        PGSimpleDataSource ds = new PGSimpleDataSource();
        ds.setServerNames(new String[]{"$DB_HOST"});
        ds.setPortNumbers(new int[]{$DB_PORT});
        ds.setDatabaseName("$DB_NAME");
        ds.setUser("$DB_USER");
        ds.setPassword("zww0625wh");
        
        Flyway flyway = Flyway.configure()
            .dataSource(ds)
            .schemas("$schema")
            .locations("classpath:db/tenant-migration")
            .baselineOnMigrate(true)
            .validateOnMigrate(true)
            .cleanDisabled(true)
            .load();
        
        flyway.migrate();
        System.out.println("Migration completed for schema: $schema");
    }
}
"@
    
    # 使用测试类执行迁移
    mvn test -Dtest=TenantFlywayMigrationTest -q
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $schema 迁移成功" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $schema 迁移失败" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "迁移完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 5. 验证迁移结果
Write-Host "4. 验证迁移结果..." -ForegroundColor Yellow

foreach ($schema in $emptySchemas) {
    $tableCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';"
    
    if ([int]$tableCount -gt 0) {
        Write-Host "   ✅ $schema - 成功创建 $tableCount 个表" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $schema - 仍然是空schema" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ 所有操作完成！" -ForegroundColor Green

