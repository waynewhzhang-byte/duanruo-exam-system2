# UI端BDD测试运行脚本
# 使用Playwright运行完整的考试流程UI测试

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UI端BDD测试：完整考试流程" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查前端是否运行
Write-Host "[检查] 验证前端服务..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ 前端服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端服务未运行，请先启动前端: cd web; npm run dev" -ForegroundColor Red
    exit 1
}

# 检查后端是否运行
Write-Host "[检查] 验证后端服务..." -ForegroundColor Yellow
try {
    # 尝试访问登录接口来验证后端
    $testConnection = Test-NetConnection -ComputerName localhost -Port 8081 -WarningAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✅ 后端服务运行正常" -ForegroundColor Green
    } else {
        Write-Host "❌ 后端服务未运行，请先启动后端" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 后端服务未运行，请先启动后端" -ForegroundColor Red
    exit 1
}

# 创建测试结果目录
Write-Host "[准备] 创建测试结果目录..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "web/test-results/screenshots" | Out-Null
New-Item -ItemType Directory -Force -Path "web/test-results/videos" | Out-Null
Write-Host "✅ 测试结果目录创建成功" -ForegroundColor Green

# 运行UI测试
Write-Host ""
Write-Host "[执行] 运行UI端BDD测试..." -ForegroundColor Yellow
Write-Host ""

cd web
npx ts-node tests/bdd/run-ui-test.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ UI端BDD测试完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "测试结果:" -ForegroundColor Cyan
    Write-Host "  - 截图: web/test-results/screenshots/" -ForegroundColor White
    Write-Host "  - 视频: web/test-results/videos/" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ UI端BDD测试失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}

