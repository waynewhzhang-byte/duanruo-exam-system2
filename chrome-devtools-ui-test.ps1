# Chrome DevTools UI测试脚本
# 使用chrome-devtools工具进行真实的UI测试

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chrome DevTools UI测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查前端服务
Write-Host "[检查] 验证前端服务..." -ForegroundColor Yellow
try {
    $testConnection = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✅ 前端服务运行正常" -ForegroundColor Green
    } else {
        Write-Host "❌ 前端服务未运行，请先启动: cd web; npm run dev" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 前端服务未运行" -ForegroundColor Red
    exit 1
}

# 检查后端服务
Write-Host "[检查] 验证后端服务..." -ForegroundColor Yellow
try {
    $testConnection = Test-NetConnection -ComputerName localhost -Port 8081 -WarningAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✅ 后端服务运行正常" -ForegroundColor Green
    } else {
        Write-Host "❌ 后端服务未运行，请先启动后端" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 后端服务未运行" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始Chrome DevTools UI测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 测试场景选择
Write-Host "请选择测试场景:" -ForegroundColor Yellow
Write-Host "1. 超级管理员登录测试" -ForegroundColor White
Write-Host "2. 租户管理员登录测试" -ForegroundColor White
Write-Host "3. 考生登录测试" -ForegroundColor White
Write-Host "4. 完整考试流程测试" -ForegroundColor White
Write-Host "5. 审核流程测试" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入选择 (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "测试场景1: 超级管理员登录" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "账户信息:" -ForegroundColor Yellow
        Write-Host "  用户名: super_admin" -ForegroundColor White
        Write-Host "  密码:   SuperAdmin123!@#" -ForegroundColor White
        Write-Host "  URL:    http://localhost:3000/login?role=super-admin" -ForegroundColor White
        Write-Host ""
        Write-Host "测试步骤:" -ForegroundColor Yellow
        Write-Host "  1. 打开浏览器访问登录页面" -ForegroundColor Gray
        Write-Host "  2. 填写用户名和密码" -ForegroundColor Gray
        Write-Host "  3. 点击登录按钮" -ForegroundColor Gray
        Write-Host "  4. 验证跳转到超级管理员页面" -ForegroundColor Gray
        Write-Host ""
        Write-Host "按任意键在浏览器中打开登录页面..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Start-Process "http://localhost:3000/login?role=super-admin"
    }
    "2" {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "测试场景2: 租户管理员登录" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "账户信息:" -ForegroundColor Yellow
        Write-Host "  用户名: tenant_admin_1762476737466" -ForegroundColor White
        Write-Host "  密码:   TenantAdmin@123" -ForegroundColor White
        Write-Host "  URL:    http://localhost:3000/login" -ForegroundColor White
        Write-Host ""
        Write-Host "测试步骤:" -ForegroundColor Yellow
        Write-Host "  1. 打开浏览器访问登录页面" -ForegroundColor Gray
        Write-Host "  2. 填写用户名和密码" -ForegroundColor Gray
        Write-Host "  3. 点击登录按钮" -ForegroundColor Gray
        Write-Host "  4. 验证跳转到租户管理页面" -ForegroundColor Gray
        Write-Host ""
        Write-Host "按任意键在浏览器中打开登录页面..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Start-Process "http://localhost:3000/login"
    }
    "3" {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "测试场景3: 考生登录" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "账户信息:" -ForegroundColor Yellow
        Write-Host "  用户名: candidate_1762476516042" -ForegroundColor White
        Write-Host "  密码:   Candidate@123" -ForegroundColor White
        Write-Host "  URL:    http://localhost:3000/login" -ForegroundColor White
        Write-Host ""
        Write-Host "测试步骤:" -ForegroundColor Yellow
        Write-Host "  1. 打开浏览器访问登录页面" -ForegroundColor Gray
        Write-Host "  2. 填写用户名和密码" -ForegroundColor Gray
        Write-Host "  3. 点击登录按钮" -ForegroundColor Gray
        Write-Host "  4. 验证跳转到考生页面" -ForegroundColor Gray
        Write-Host ""
        Write-Host "按任意键在浏览器中打开登录页面..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Start-Process "http://localhost:3000/login"
    }
    "4" {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "测试场景4: 完整考试流程" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "此场景将依次测试:" -ForegroundColor Yellow
        Write-Host "  1. 租户管理员创建考试" -ForegroundColor Gray
        Write-Host "  2. 考生报名考试" -ForegroundColor Gray
        Write-Host "  3. 审核员审核报名" -ForegroundColor Gray
        Write-Host "  4. 考生查看准考证" -ForegroundColor Gray
        Write-Host "  5. 考生查询成绩" -ForegroundColor Gray
        Write-Host ""
        Write-Host "运行完整的UI测试..." -ForegroundColor Cyan
        .\run-ui-bdd-test.ps1
    }
    "5" {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "测试场景5: 审核流程" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "一级审核员账户:" -ForegroundColor Yellow
        Write-Host "  用户名: bdd_reviewer1" -ForegroundColor White
        Write-Host "  密码:   Reviewer123!@#" -ForegroundColor White
        Write-Host "  URL:    http://localhost:3000/login?role=reviewer" -ForegroundColor White
        Write-Host ""
        Write-Host "二级审核员账户:" -ForegroundColor Yellow
        Write-Host "  用户名: bdd_reviewer2" -ForegroundColor White
        Write-Host "  密码:   Reviewer123!@#" -ForegroundColor White
        Write-Host "  URL:    http://localhost:3000/login?role=reviewer" -ForegroundColor White
        Write-Host ""
        Write-Host "按任意键在浏览器中打开审核员登录页面..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Start-Process "http://localhost:3000/login?role=reviewer"
    }
    default {
        Write-Host "❌ 无效的选择" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chrome DevTools 使用提示" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "在浏览器中按 F12 打开 DevTools，然后:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 在 Console 中快速填写登录表单:" -ForegroundColor White
Write-Host "   document.querySelector('input[name=\""username\""]').value = '用户名';" -ForegroundColor Gray
Write-Host "   document.querySelector('input[name=\""password\""]').value = '密码';" -ForegroundColor Gray
Write-Host "   document.querySelector('button[type=\""submit\""]').click();" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 在 Network 标签中查看 API 请求:" -ForegroundColor White
Write-Host "   - 查看登录请求 (/api/v1/auth/login)" -ForegroundColor Gray
Write-Host "   - 查看返回的 token" -ForegroundColor Gray
Write-Host "   - 查看后续的 API 请求" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 在 Application 标签中查看存储:" -ForegroundColor White
Write-Host "   - Local Storage: 查看 token 和用户信息" -ForegroundColor Gray
Write-Host "   - Session Storage: 查看会话数据" -ForegroundColor Gray
Write-Host "   - Cookies: 查看 cookie" -ForegroundColor Gray
Write-Host ""

