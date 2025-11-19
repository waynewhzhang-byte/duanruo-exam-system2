# 执行测试数据准备脚本
# 用于BDD测试

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "执行测试数据准备脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 数据库连接信息
$env:PGPASSWORD = "zww0625wh"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "duanruo-exam-system"
$dbUser = "postgres"

# 测试数据脚本路径
$scriptPath = "scripts/prepare-test-data.sql"

Write-Host "数据库信息:" -ForegroundColor Yellow
Write-Host "  主机: $dbHost" -ForegroundColor Gray
Write-Host "  端口: $dbPort" -ForegroundColor Gray
Write-Host "  数据库: $dbName" -ForegroundColor Gray
Write-Host "  用户: $dbUser" -ForegroundColor Gray
Write-Host ""

# 检查psql是否可用
try {
    $psqlVersion = psql --version
    Write-Host "✓ psql已安装: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: psql未安装或不在PATH中" -ForegroundColor Red
    Write-Host "  请安装PostgreSQL客户端工具" -ForegroundColor Yellow
    exit 1
}

# 检查脚本文件是否存在
if (-not (Test-Path $scriptPath)) {
    Write-Host "✗ 错误: 脚本文件不存在: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 脚本文件存在: $scriptPath" -ForegroundColor Green
Write-Host ""

# 执行SQL脚本
Write-Host "执行SQL脚本..." -ForegroundColor Yellow
try {
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $scriptPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ 测试数据准备成功！" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ 测试数据准备失败！退出代码: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "✗ 执行失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "验证测试数据" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 验证租户数据
Write-Host "检查租户数据..." -ForegroundColor Yellow
$checkTenants = @"
SELECT id, name, code, status FROM public.tenants 
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
"@

psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $checkTenants

# 验证用户数据
Write-Host ""
Write-Host "检查用户数据..." -ForegroundColor Yellow
$checkUsers = @"
SELECT id, username, email, full_name, status FROM public.users 
WHERE username IN ('tenant_admin1', 'tenant_admin2', 'reviewer1_primary', 'candidate1');
"@

psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $checkUsers

# 验证用户-租户关联
Write-Host ""
Write-Host "检查用户-租户关联..." -ForegroundColor Yellow
$checkRoles = @"
SELECT utr.id, u.username, t.name as tenant_name, utr.role, utr.active 
FROM public.user_tenant_roles utr
JOIN public.users u ON utr.user_id = u.id
JOIN public.tenants t ON utr.tenant_id = t.id
WHERE u.username = 'tenant_admin1';
"@

psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $checkRoles

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试数据准备完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "测试账号信息:" -ForegroundColor Yellow
Write-Host "  租户管理员1: tenant_admin1 / admin123@Abc" -ForegroundColor Gray
Write-Host "  租户管理员2: tenant_admin2 / admin123@Abc" -ForegroundColor Gray
Write-Host "  一级审核员: reviewer1_primary / admin123@Abc" -ForegroundColor Gray
Write-Host "  考生1: candidate1 / admin123@Abc" -ForegroundColor Gray
Write-Host ""
Write-Host "租户信息:" -ForegroundColor Yellow
Write-Host "  租户1: hr_city (某市人力资源局)" -ForegroundColor Gray
Write-Host "  租户2: edu_province (某省教育厅)" -ForegroundColor Gray
Write-Host ""

# 清理环境变量
Remove-Item Env:\PGPASSWORD

