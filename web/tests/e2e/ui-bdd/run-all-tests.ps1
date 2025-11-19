# UI BDD测试执行脚本
# 运行所有UI测试场景

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UI BDD 测试执行" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查前端服务
Write-Host "[检查] 验证前端服务..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 前端服务运行正常 (端口3000)" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端服务未运行 (端口3000)" -ForegroundColor Red
    Write-Host "   请运行: cd web; npm run dev" -ForegroundColor Yellow
    exit 1
}

# 检查后端服务
Write-Host "[检查] 验证后端服务..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 后端服务运行正常 (端口8081)" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务未运行 (端口8081)" -ForegroundColor Red
    Write-Host "   请运行: cd exam-bootstrap; mvn spring-boot:run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始执行UI测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 创建测试结果目录
$testResultsDir = "test-results"
if (-not (Test-Path $testResultsDir)) {
    New-Item -ItemType Directory -Path $testResultsDir | Out-Null
    Write-Host "✅ 创建测试结果目录: $testResultsDir" -ForegroundColor Green
}

# 运行测试
Write-Host "[测试] 运行超级管理员测试..." -ForegroundColor Yellow
npx playwright test tests/e2e/ui-bdd/01-super-admin.spec.ts --headed

Write-Host ""
Write-Host "[测试] 运行租户管理员测试..." -ForegroundColor Yellow
npx playwright test tests/e2e/ui-bdd/02-tenant-admin.spec.ts --headed

Write-Host ""
Write-Host "[测试] 运行考生测试..." -ForegroundColor Yellow
npx playwright test tests/e2e/ui-bdd/03-candidate.spec.ts --headed

Write-Host ""
Write-Host "[测试] 运行审核员测试..." -ForegroundColor Yellow
npx playwright test tests/e2e/ui-bdd/04-reviewer.spec.ts --headed

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试执行完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "查看测试报告:" -ForegroundColor Yellow
Write-Host "  npx playwright show-report" -ForegroundColor Cyan
Write-Host ""
Write-Host "查看截图:" -ForegroundColor Yellow
Write-Host "  ls test-results/*.png" -ForegroundColor Cyan
Write-Host ""

