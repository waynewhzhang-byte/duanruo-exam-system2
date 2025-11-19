# UI BDD单个测试执行脚本
# 用法: .\run-single-test.ps1 -Role "super-admin"
# 可选角色: super-admin, tenant-admin, candidate, reviewer

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("super-admin", "tenant-admin", "candidate", "reviewer")]
    [string]$Role
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UI BDD 单个角色测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "测试角色: $Role" -ForegroundColor Yellow
Write-Host ""

# 检查服务
Write-Host "[检查] 验证服务状态..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 前端服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端服务未运行" -ForegroundColor Red
    exit 1
}

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 后端服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务未运行" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 根据角色选择测试文件
$testFile = switch ($Role) {
    "super-admin"   { "tests/e2e/ui-bdd/01-super-admin.spec.ts" }
    "tenant-admin"  { "tests/e2e/ui-bdd/02-tenant-admin.spec.ts" }
    "candidate"     { "tests/e2e/ui-bdd/03-candidate.spec.ts" }
    "reviewer"      { "tests/e2e/ui-bdd/04-reviewer.spec.ts" }
}

Write-Host "[测试] 运行 $Role 测试..." -ForegroundColor Yellow
Write-Host "测试文件: $testFile" -ForegroundColor Cyan
Write-Host ""

# 运行测试
npx playwright test $testFile --headed

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "查看测试报告:" -ForegroundColor Yellow
Write-Host "  npx playwright show-report" -ForegroundColor Cyan
Write-Host ""

