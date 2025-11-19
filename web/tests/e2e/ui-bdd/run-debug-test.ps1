# UI BDD调试模式测试脚本
# 用法: .\run-debug-test.ps1 -Role "candidate" -Scenario "场景3"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("super-admin", "tenant-admin", "candidate", "reviewer")]
    [string]$Role,
    
    [Parameter(Mandatory=$false)]
    [string]$Scenario = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UI BDD 调试模式" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "测试角色: $Role" -ForegroundColor Yellow
if ($Scenario) {
    Write-Host "测试场景: $Scenario" -ForegroundColor Yellow
}
Write-Host ""

# 根据角色选择测试文件
$testFile = switch ($Role) {
    "super-admin"   { "tests/e2e/ui-bdd/01-super-admin.spec.ts" }
    "tenant-admin"  { "tests/e2e/ui-bdd/02-tenant-admin.spec.ts" }
    "candidate"     { "tests/e2e/ui-bdd/03-candidate.spec.ts" }
    "reviewer"      { "tests/e2e/ui-bdd/04-reviewer.spec.ts" }
}

Write-Host "[调试] 启动调试模式..." -ForegroundColor Yellow
Write-Host "测试文件: $testFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "调试提示:" -ForegroundColor Yellow
Write-Host "  - 浏览器将以慢速模式运行" -ForegroundColor Cyan
Write-Host "  - 可以使用 Playwright Inspector 进行调试" -ForegroundColor Cyan
Write-Host "  - 按 F8 继续执行，F10 单步执行" -ForegroundColor Cyan
Write-Host ""

# 运行调试模式
if ($Scenario) {
    npx playwright test $testFile --headed --debug -g "$Scenario"
} else {
    npx playwright test $testFile --headed --debug
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "调试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

