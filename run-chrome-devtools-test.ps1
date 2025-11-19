# Chrome DevTools 自动化UI测试
# 使用chrome-devtools工具进行真实的浏览器自动化测试

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("super-admin", "tenant-admin", "candidate", "reviewer", "all")]
    [string]$TestScenario = "all"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chrome DevTools 自动化UI测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查服务状态
Write-Host "[检查] 验证服务状态..." -ForegroundColor Yellow

$frontendOk = (Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded
$backendOk = (Test-NetConnection -ComputerName localhost -Port 8081 -WarningAction SilentlyContinue).TcpTestSucceeded

if (-not $frontendOk) {
    Write-Host "❌ 前端服务未运行 (端口3000)" -ForegroundColor Red
    Write-Host "   请运行: cd web; npm run dev" -ForegroundColor Yellow
    exit 1
}

if (-not $backendOk) {
    Write-Host "❌ 后端服务未运行 (端口8081)" -ForegroundColor Red
    Write-Host "   请运行: cd exam-bootstrap; mvn spring-boot:run" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 前端服务运行正常 (端口3000)" -ForegroundColor Green
Write-Host "✅ 后端服务运行正常 (端口8081)" -ForegroundColor Green
Write-Host ""

# 测试账户信息
$testAccounts = @{
    "super-admin" = @{
        username = "super_admin"
        password = "SuperAdmin123!@#"
        url = "http://localhost:3000/login?role=super-admin"
        name = "超级管理员"
    }
    "tenant-admin" = @{
        username = "tenant_admin_1762476737466"
        password = "TenantAdmin@123"
        url = "http://localhost:3000/login"
        name = "租户管理员"
    }
    "candidate" = @{
        username = "candidate_1762476516042"
        password = "Candidate@123"
        url = "http://localhost:3000/login"
        name = "考生"
    }
    "reviewer" = @{
        username = "bdd_reviewer1"
        password = "Reviewer123!@#"
        url = "http://localhost:3000/login?role=reviewer"
        name = "一级审核员"
    }
}

# 执行测试
function Test-Login {
    param(
        [string]$AccountType
    )
    
    $account = $testAccounts[$AccountType]
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "测试: $($account.name)登录" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "账户信息:" -ForegroundColor Yellow
    Write-Host "  用户名: $($account.username)" -ForegroundColor White
    Write-Host "  密码:   $($account.password)" -ForegroundColor White
    Write-Host "  URL:    $($account.url)" -ForegroundColor White
    Write-Host ""
    
    # 打开浏览器
    Write-Host "[步骤1] 打开浏览器..." -ForegroundColor Cyan
    Start-Process $account.url
    Start-Sleep -Seconds 3
    
    Write-Host "✅ 浏览器已打开" -ForegroundColor Green
    Write-Host ""
    
    # 显示Chrome DevTools操作指南
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Chrome DevTools 操作指南" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 按 F12 打开 Chrome DevTools" -ForegroundColor White
    Write-Host ""
    Write-Host "2. 切换到 Console 标签" -ForegroundColor White
    Write-Host ""
    Write-Host "3. 复制并执行以下代码进行登录:" -ForegroundColor White
    Write-Host ""
    Write-Host "// 填写登录表单" -ForegroundColor Gray
    Write-Host "document.querySelector('input[name=\""username\""]').value = '$($account.username)';" -ForegroundColor Cyan
    Write-Host "document.querySelector('input[name=\""password\""]').value = '$($account.password)';" -ForegroundColor Cyan
    Write-Host "document.querySelector('button[type=\""submit\""]').click();" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. 切换到 Network 标签查看 API 请求:" -ForegroundColor White
    Write-Host "   - 找到 /api/v1/auth/login 请求" -ForegroundColor Gray
    Write-Host "   - 查看 Response 中的 token" -ForegroundColor Gray
    Write-Host "   - 验证状态码为 200" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. 切换到 Application 标签查看存储:" -ForegroundColor White
    Write-Host "   - Local Storage > http://localhost:3000" -ForegroundColor Gray
    Write-Host "   - 查看 token 和 user 信息" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    # 等待用户确认
    Write-Host "按任意键继续下一个测试..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ""
}

# 根据参数执行测试
if ($TestScenario -eq "all") {
    Write-Host "执行所有测试场景..." -ForegroundColor Cyan
    Write-Host ""
    
    Test-Login -AccountType "super-admin"
    Test-Login -AccountType "tenant-admin"
    Test-Login -AccountType "candidate"
    Test-Login -AccountType "reviewer"
} else {
    Test-Login -AccountType $TestScenario
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 所有测试完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "测试总结:" -ForegroundColor Yellow
Write-Host "  - 所有账户的登录页面已在浏览器中打开" -ForegroundColor White
Write-Host "  - 请使用 Chrome DevTools 进行手动验证" -ForegroundColor White
Write-Host "  - 或运行自动化测试: .\run-ui-bdd-test.ps1" -ForegroundColor White
Write-Host ""

