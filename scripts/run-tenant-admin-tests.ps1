# 运行租户管理员创建和权限测试

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "租户管理员创建和权限测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查服务是否运行
Write-Host "检查服务状态..." -ForegroundColor Yellow

# 检查后端
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/v1/tenants" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ 后端服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "✗ 后端服务未运行，请先启动后端服务" -ForegroundColor Red
    Write-Host "  运行: mvn spring-boot:run -pl exam-bootstrap" -ForegroundColor Yellow
    exit 1
}

# 检查前端
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ 前端服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "✗ 前端服务未运行，请先启动前端服务" -ForegroundColor Red
    Write-Host "  运行: cd web && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始运行测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 切换到 web 目录
Set-Location -Path "$PSScriptRoot\..\web"

# 运行 Playwright 测试
Write-Host "运行 Playwright 测试..." -ForegroundColor Yellow
Write-Host ""

# 只运行租户管理员测试
npx playwright test tests/e2e/admin/tenant-admin-creation.spec.ts --project=chromium --reporter=list,html

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "✓ 所有测试通过" -ForegroundColor Green
} else {
    Write-Host "✗ 部分测试失败" -ForegroundColor Red
}

Write-Host ""
Write-Host "查看测试报告:" -ForegroundColor Yellow
Write-Host "  HTML报告: web/playwright-report/index.html" -ForegroundColor Cyan
Write-Host "  JSON报告: web/test-results.json" -ForegroundColor Cyan
Write-Host "  JUnit报告: web/test-results.xml" -ForegroundColor Cyan
Write-Host ""

# 询问是否打开 HTML 报告
$openReport = Read-Host "是否打开 HTML 测试报告? (Y/N)"
if ($openReport -eq "Y" -or $openReport -eq "y") {
    Start-Process "playwright-report/index.html"
}

exit $exitCode

