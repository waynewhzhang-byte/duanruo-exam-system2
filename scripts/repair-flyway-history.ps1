# Flyway History修复脚本
# 目的：清理flyway_schema_history表，只保留实际存在的迁移脚本记录

$env:PGPASSWORD = "zww0625wh"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "duanruo-exam-system"
$dbUser = "postgres"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Flyway History 修复脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 显示当前flyway_schema_history状态
Write-Host "1. 当前Flyway迁移历史记录：" -ForegroundColor Yellow
psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT installed_rank, version, description, type, script, success FROM public.flyway_schema_history ORDER BY installed_rank;"

Write-Host ""
Write-Host "2. 删除已不存在的迁移记录（001-009, 012-014, 016）..." -ForegroundColor Yellow

# 删除已标记但文件不存在的迁移记录
$versionsToDelete = @('001', '002', '003', '004', '005', '006', '007', '008', '009', '012', '013', '014', '016')

foreach ($version in $versionsToDelete) {
    Write-Host "   删除版本 $version..." -ForegroundColor Gray
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "DELETE FROM public.flyway_schema_history WHERE version = '$version';"
}

Write-Host ""
Write-Host "3. 插入实际存在的迁移记录..." -ForegroundColor Yellow

# 插入实际存在的迁移记录（如果不存在）
$migrationsToInsert = @(
    @{version='002.1'; description='Create user tables'; script='V002_1__Create_user_tables.sql'},
    @{version='009.1'; description='Fix users version constraint'; script='V009_1__Fix_users_version_constraint.sql'},
    @{version='010'; description='Create tenant tables'; script='V010__Create_tenant_tables.sql'},
    @{version='011'; description='Add performance indexes'; script='V011__Add_performance_indexes.sql'},
    @{version='015'; description='Extend columns for encryption'; script='V015__Extend_columns_for_encryption.sql'},
    @{version='017'; description='create notification templates table'; script='V017__create_notification_templates_table.sql'},
    @{version='018'; description='create notification histories table'; script='V018__create_notification_histories_table.sql'},
    @{version='019'; description='create pii access logs table'; script='V019__create_pii_access_logs_table.sql'},
    @{version='020'; description='create tenant backups table'; script='V020__create_tenant_backups_table.sql'},
    @{version='021'; description='create audit logs table'; script='V021__create_audit_logs_table.sql'},
    @{version='1.11'; description='Add exam status in progress completed'; script='V1.11__Add_exam_status_in_progress_completed.sql'},
    @{version='999'; description='Insert BDD test data'; script='V999__Insert_BDD_test_data.sql'}
)

foreach ($migration in $migrationsToInsert) {
    $version = $migration.version
    $description = $migration.description
    $script = $migration.script
    
    # 检查是否已存在
    $exists = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c "SELECT COUNT(*) FROM public.flyway_schema_history WHERE version = '$version';"
    
    if ($exists -eq "0") {
        Write-Host "   插入版本 $version ($description)..." -ForegroundColor Gray
        
        $sql = @"
INSERT INTO public.flyway_schema_history 
(installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES 
((SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM public.flyway_schema_history), 
 '$version', 
 '$description', 
 'SQL', 
 '$script', 
 NULL, 
 'postgres', 
 CURRENT_TIMESTAMP, 
 0, 
 true);
"@
        
        psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $sql
    } else {
        Write-Host "   版本 $version 已存在，跳过" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "4. 修复后的Flyway迁移历史记录：" -ForegroundColor Yellow
psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT installed_rank, version, description, type, script, success FROM public.flyway_schema_history ORDER BY installed_rank;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Flyway History 修复完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：重新启动后端服务" -ForegroundColor Cyan
Write-Host "  cd exam-bootstrap" -ForegroundColor White
Write-Host "  mvn spring-boot:run -Dspring-boot.run.profiles=dev" -ForegroundColor White

