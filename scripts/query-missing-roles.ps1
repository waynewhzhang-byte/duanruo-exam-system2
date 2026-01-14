# 查询缺少 UserTenantRole 的用户
param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "duanruo-exam-system",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres"
)

Write-Host "=== 查询缺少 UserTenantRole 的租户管理员 ===" -ForegroundColor Cyan
Write-Host ""

# 设置 PostgreSQL 连接
$env:PGPASSWORD = $DbPassword

# 查询所有租户
Write-Host "【租户列表】" -ForegroundColor Yellow
$tenantsQuery = @"
SELECT id, code, name, active
FROM public.tenants
ORDER BY created_at DESC;
"@

psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $tenantsQuery

Write-Host ""
Write-Host "【所有用户】" -ForegroundColor Yellow
$usersQuery = @"
SELECT id, username, email, full_name, roles
FROM public.users
ORDER BY created_at DESC
LIMIT 20;
"@

psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $usersQuery

Write-Host ""
Write-Host "【现有的 UserTenantRole 记录】" -ForegroundColor Yellow
$rolesQuery = @"
SELECT utr.id, u.username, t.code AS tenant_code, utr.role, utr.active
FROM public.user_tenant_roles utr
LEFT JOIN public.users u ON utr.user_id = u.id
LEFT JOIN public.tenants t ON utr.tenant_id = t.id
ORDER BY utr.created_at DESC;
"@

psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $rolesQuery

Write-Host ""
Write-Host "【缺少 UserTenantRole 的租户管理员】" -ForegroundColor Red
$missingQuery = @"
SELECT
    u.id AS user_id,
    u.username,
    u.email,
    u.full_name,
    u.roles
FROM public.users u
LEFT JOIN public.user_tenant_roles utr ON u.id = utr.user_id
WHERE u.roles @> ARRAY['TENANT_ADMIN']::varchar[]
  AND utr.id IS NULL
ORDER BY u.created_at DESC;
"@

psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $missingQuery

# 清除密码环境变量
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "=== 查询完成 ===" -ForegroundColor Green
