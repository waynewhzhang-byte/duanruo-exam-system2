# 修复租户管理员访问权限
# 此脚本用于为已存在的租户管理员创建 UserTenantRole 记录

param(
    [Parameter(Mandatory=$false)]
    [string]$Username,

    [Parameter(Mandatory=$false)]
    [string]$TenantSlug,

    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "http://localhost:8081/api/v1"
)

Write-Host "=== 租户管理员访问权限修复工具 ===" -ForegroundColor Cyan
Write-Host ""

# 读取用户输入
if (-not $Username) {
    $Username = Read-Host "请输入租户管理员的用户名"
}

if (-not $TenantSlug) {
    $TenantSlug = Read-Host "请输入租户的 slug (例如: test_company_1762456657147)"
}

Write-Host ""
Write-Host "正在查询数据..." -ForegroundColor Yellow

# 获取超级管理员 Token（需要用户提供）
$Token = Read-Host "请输入超级管理员的 JWT Token (从浏览器开发者工具中获取)"

if (-not $Token) {
    Write-Host "❌ 未提供 Token，无法继续" -ForegroundColor Red
    exit 1
}

$Headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

try {
    # 1. 根据 slug 获取租户信息
    Write-Host "1. 查询租户信息..." -ForegroundColor Yellow
    $TenantUrl = "$BackendUrl/tenants/slug/$TenantSlug"
    $Tenant = Invoke-RestMethod -Uri $TenantUrl -Method Get -Headers $Headers
    Write-Host "   ✅ 找到租户: $($Tenant.name) (ID: $($Tenant.id))" -ForegroundColor Green

    # 2. 查询用户信息（需要从用户列表中查找）
    Write-Host "2. 查询用户信息..." -ForegroundColor Yellow
    # 注意：这里假设有一个查询用户的 API，实际可能需要调整
    # 如果没有直接的 API，需要用户手动提供 UserId

    $UserId = Read-Host "   请输入用户的 UUID (从数据库或之前的响应中获取)"

    if (-not $UserId) {
        Write-Host "   ❌ 未提供用户 UUID，无法继续" -ForegroundColor Red
        exit 1
    }

    Write-Host "   ✅ 用户 UUID: $UserId" -ForegroundColor Green

    # 3. 调用 API 添加用户到租户
    Write-Host "3. 添加用户到租户..." -ForegroundColor Yellow
    $AddUserUrl = "$BackendUrl/$($Tenant.id)/users/$UserId/roles?role=TENANT_ADMIN"

    Invoke-RestMethod -Uri $AddUserUrl -Method Post -Headers $Headers | Out-Null

    Write-Host "   ✅ 成功添加用户到租户！" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "修复完成！" -ForegroundColor Green
    Write-Host "用户 '$Username' 现在可以访问租户 '$($Tenant.name)'" -ForegroundColor Green
    Write-Host "请让用户重新登录以刷新权限" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "详细错误信息:" -ForegroundColor Yellow
    Write-Host $_.Exception | Format-List -Force

    Write-Host ""
    Write-Host "可能的原因:" -ForegroundColor Yellow
    Write-Host "1. Token 无效或已过期" -ForegroundColor Gray
    Write-Host "2. 用户或租户不存在" -ForegroundColor Gray
    Write-Host "3. 用户已经属于该租户" -ForegroundColor Gray
    Write-Host "4. 没有足够的权限" -ForegroundColor Gray

    exit 1
}
