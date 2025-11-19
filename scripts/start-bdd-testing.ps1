# BDD测试启动和验证脚本
# 用途: 启动前后端服务并验证环境准备就绪

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BDD测试环境启动和验证" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查后端服务
Write-Host "[1/5] 检查后端服务..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/actuator/health" -Method Get -TimeoutSec 5
    if ($backendHealth.status -eq "UP") {
        Write-Host "  ✓ 后端服务运行正常 (端口 8081)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 后端服务状态异常: $($backendHealth.status)" -ForegroundColor Red
        Write-Host "  请先启动后端服务: mvn spring-boot:run -pl exam-bootstrap" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ✗ 后端服务未运行" -ForegroundColor Red
    Write-Host "  请先启动后端服务: mvn spring-boot:run -pl exam-bootstrap" -ForegroundColor Yellow
    exit 1
}

# 2. 检查前端服务
Write-Host "[2/5] 检查前端服务..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "  ✓ 前端服务运行正常 (端口 3000)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 前端服务响应异常: $($frontendResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ 前端服务未运行" -ForegroundColor Red
    Write-Host "  请先启动前端服务: cd web && npm run dev" -ForegroundColor Yellow
    exit 1
}

# 3. 检查数据库连接
Write-Host "[3/5] 检查数据库连接..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "password"
    $dbCheck = psql -h localhost -U postgres -d duanruo-exam-system -c "SELECT 1" -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ 数据库连接正常" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 数据库连接失败" -ForegroundColor Red
        Write-Host "  错误: $dbCheck" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ 数据库连接失败: $_" -ForegroundColor Red
    exit 1
}

# 4. 检查测试用户
Write-Host "[4/5] 检查测试用户..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "password"
    $userCount = psql -h localhost -U postgres -d duanruo-exam-system -c "SELECT COUNT(*) FROM public.users WHERE username IN ('super_admin', 'tenant_admin', 'bdd_candidate')" -t 2>&1
    $userCount = $userCount.Trim()
    if ($userCount -ge 2) {
        Write-Host "  ✓ 测试用户已准备 ($userCount 个用户)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 测试用户不足 (当前: $userCount 个)" -ForegroundColor Yellow
        Write-Host "  建议运行: npm run test:setup (在 web 目录)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ 无法检查测试用户: $_" -ForegroundColor Yellow
}

# 5. 检查Playwright安装
Write-Host "[5/5] 检查Playwright安装..." -ForegroundColor Yellow
Push-Location web
try {
    $playwrightVersion = npx playwright --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Playwright已安装: $playwrightVersion" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Playwright未安装" -ForegroundColor Red
        Write-Host "  请运行: npm run test:setup" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
} catch {
    Write-Host "  ✗ Playwright检查失败: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ 环境验证完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "可用的测试命令:" -ForegroundColor Cyan
Write-Host "  1. 运行所有BDD测试:    cd web && npm run test:bdd" -ForegroundColor White
Write-Host "  2. 运行冒烟测试:       cd web && npm run test:bdd:smoke" -ForegroundColor White
Write-Host "  3. 运行P0测试:         cd web && npm run test:bdd:p0" -ForegroundColor White
Write-Host "  4. 运行P1测试:         cd web && npm run test:bdd:p1" -ForegroundColor White
Write-Host "  5. 运行E2E测试(UI):    cd web && npm run test:e2e:ui" -ForegroundColor White
Write-Host "  6. 运行E2E测试(调试):  cd web && npm run test:e2e:debug" -ForegroundColor White
Write-Host ""
Write-Host "查看测试报告:" -ForegroundColor Cyan
Write-Host "  - Playwright报告:      cd web && npm run test:e2e:report" -ForegroundColor White
Write-Host "  - BDD报告:             cd web && npm run test:bdd:report" -ForegroundColor White
Write-Host ""

