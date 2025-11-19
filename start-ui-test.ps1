# Chrome DevTools UI完整测试启动脚本
# 测试：1. 登录后权限是否正常  2. 各个操作UI功能是否可以正常调用

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chrome DevTools UI 完整测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查服务状态
Write-Host "[检查] 验证服务状态..." -ForegroundColor Yellow

$backendOk = $false
$frontendOk = $false

# 检查后端
try {
    $loginTest = @{
        username = "super_admin"
        password = "SuperAdmin123!@#"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/login" `
        -Method POST `
        -Body $loginTest `
        -ContentType "application/json" `
        -TimeoutSec 5
    
    Write-Host "✅ 后端服务正常 (http://localhost:8081)" -ForegroundColor Green
    $backendOk = $true
} catch {
    Write-Host "❌ 后端服务未运行或无法访问" -ForegroundColor Red
    Write-Host "   请确保后端已启动: cd exam-bootstrap; mvn spring-boot:run" -ForegroundColor Yellow
}

# 检查前端
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 前端服务正常 (http://localhost:3000)" -ForegroundColor Green
    $frontendOk = $true
} catch {
    Write-Host "❌ 前端服务未运行或无法访问" -ForegroundColor Red
    Write-Host "   请确保前端已启动: cd web; npm run dev" -ForegroundColor Yellow
}

if (-not ($backendOk -and $frontendOk)) {
    Write-Host ""
    Write-Host "请先启动所有服务后再运行此测试" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 服务检查通过，开始UI测试" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 打开浏览器
Write-Host "[启动] 打开浏览器..." -ForegroundColor Cyan
Start-Process "http://localhost:3000/login"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "测试指南" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 测试内容：" -ForegroundColor White
Write-Host "  1. 登录后权限是否正常" -ForegroundColor Gray
Write-Host "  2. 各个操作UI功能是否可以正常调用" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 操作步骤：" -ForegroundColor White
Write-Host "  1. 在浏览器中按 F12 打开 Chrome DevTools" -ForegroundColor Gray
Write-Host "  2. 切换到 Console 标签" -ForegroundColor Gray
Write-Host "  3. 按照下面的测试场景执行测试" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试场景1: 超级管理员权限测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤1: 登录超级管理员" -ForegroundColor Yellow
Write-Host "在Console中执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
document.querySelector('input[name="username"]').value = 'super_admin';
document.querySelector('input[name="password"]').value = 'SuperAdmin123!@#';
document.querySelector('button[type="submit"]').click();
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤2: 验证登录成功" -ForegroundColor Yellow
Write-Host "  - Network标签: 查看 /api/v1/auth/login 返回200" -ForegroundColor Gray
Write-Host "  - Application标签: 查看Local Storage中的token" -ForegroundColor Gray
Write-Host "  - Console中查看用户信息:" -ForegroundColor Gray
Write-Host ""
Write-Host @"
const user = JSON.parse(localStorage.getItem('user'));
console.log('当前用户:', user);
console.log('用户角色:', user.roles);
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤3: 测试租户管理权限" -ForegroundColor Yellow
Write-Host "在Console中执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
// 查看租户列表
fetch('http://localhost:8081/api/v1/tenants', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(data => console.log('✅ 租户列表:', data))
.catch(err => console.error('❌ 访问失败:', err));
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤4: 测试创建租户功能" -ForegroundColor Yellow
Write-Host "在Console中执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
fetch('http://localhost:8081/api/v1/tenants', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '测试租户_' + Date.now(),
    code: 'test_' + Date.now(),
    contactEmail: 'test@example.com',
    contactPhone: '13800138000'
  })
})
.then(r => r.json())
.then(data => console.log('✅ 创建租户成功:', data))
.catch(err => console.error('❌ 创建失败:', err));
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "按任意键继续查看租户管理员测试..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试场景2: 租户管理员权限测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤1: 退出并重新登录为租户管理员" -ForegroundColor Yellow
Write-Host "在Console中执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
localStorage.clear();
location.href = 'http://localhost:3000/login';
"@ -ForegroundColor Cyan
Write-Host ""
Write-Host "等待页面刷新后，执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
document.querySelector('input[name="username"]').value = 'tenant_admin_1762476737466';
document.querySelector('input[name="password"]').value = 'TenantAdmin@123';
document.querySelector('button[type="submit"]').click();
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤2: 测试查看考试列表" -ForegroundColor Yellow
Write-Host "在Console中执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
const tenantId = '421eee4a-1a2a-4f9d-95a4-37073d4b15c5';
fetch(`http://localhost:8081/api/v1/`+tenantId+`/exams`, {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'X-Tenant-Id': tenantId
  }
})
.then(r => r.json())
.then(data => console.log('✅ 考试列表:', data))
.catch(err => console.error('❌ 访问失败:', err));
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤3: 测试创建考试功能" -ForegroundColor Yellow
Write-Host "在Console中执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
const tenantId = '421eee4a-1a2a-4f9d-95a4-37073d4b15c5';
fetch(`http://localhost:8081/api/v1/`+tenantId+`/exams`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'X-Tenant-Id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    examName: 'UI测试考试_' + Date.now(),
    examType: 'RECRUITMENT',
    registrationStart: '2025-01-01 00:00:00',
    registrationEnd: '2025-12-31 23:59:59',
    examStart: '2026-01-01 09:00:00',
    examEnd: '2026-01-01 12:00:00',
    feeRequired: false
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ 创建考试成功:', data);
  sessionStorage.setItem('testExamId', data.data.id);
})
.catch(err => console.error('❌ 创建失败:', err));
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤4: 测试权限边界（应该失败）" -ForegroundColor Yellow
Write-Host "在Console中执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
// 租户管理员不应该能访问其他租户的数据
fetch('http://localhost:8081/api/v1/00000000-0000-0000-0000-000000000001/exams', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'X-Tenant-Id': '00000000-0000-0000-0000-000000000001'
  }
})
.then(r => r.json())
.then(data => console.error('❌ 权限检查失败: 不应该能访问其他租户数据'))
.catch(err => console.log('✅ 权限检查正常: 无法访问其他租户数据'));
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "按任意键继续查看考生测试..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试场景3: 考生权限测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤1: 重新登录为考生" -ForegroundColor Yellow
Write-Host @"
localStorage.clear();
location.href = 'http://localhost:3000/login';
"@ -ForegroundColor Cyan
Write-Host ""
Write-Host "等待页面刷新后，执行:" -ForegroundColor White
Write-Host ""
Write-Host @"
document.querySelector('input[name="username"]').value = 'candidate_1762476516042';
document.querySelector('input[name="password"]').value = 'Candidate@123';
document.querySelector('button[type="submit"]').click();
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤2: 测试查看报名列表" -ForegroundColor Yellow
Write-Host @"
fetch('http://localhost:8081/api/v1/applications/my', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(data => console.log('✅ 我的报名:', data))
.catch(err => console.error('❌ 访问失败:', err));
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤3: 测试权限边界（考生不应该能创建考试）" -ForegroundColor Yellow
Write-Host @"
const tenantId = '421eee4a-1a2a-4f9d-95a4-37073d4b15c5';
fetch(`http://localhost:8081/api/v1/`+tenantId+`/exams`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'X-Tenant-Id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ examName: 'test' })
})
.then(r => r.json())
.then(data => console.error('❌ 权限检查失败: 考生不应该能创建考试'))
.catch(err => console.log('✅ 权限检查正常: 考生无法创建考试'));
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 测试指南显示完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 验证清单：" -ForegroundColor Yellow
Write-Host "  □ 超级管理员可以管理租户" -ForegroundColor White
Write-Host "  □ 租户管理员可以管理考试" -ForegroundColor White
Write-Host "  □ 租户管理员不能访问其他租户数据" -ForegroundColor White
Write-Host "  □ 考生可以查看自己的报名" -ForegroundColor White
Write-Host "  □ 考生不能创建考试" -ForegroundColor White
Write-Host "  □ 所有API调用都包含正确的Authorization头" -ForegroundColor White
Write-Host "  □ 权限边界检查正常工作" -ForegroundColor White
Write-Host ""
Write-Host "详细测试脚本请查看: web/tests/chrome-devtools/complete-ui-test.ts" -ForegroundColor Cyan
Write-Host ""

