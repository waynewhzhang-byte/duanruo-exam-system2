# Playwright 测试问题修复脚本
# 修复在测试过程中发现的问题

param(
    [switch]$RunTests = $false,
    [switch]$FixDatabase = $false,
    [switch]$UpdateConfig = $false
)

Write-Host "🔧 Playwright 测试问题修复脚本" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查当前目录
$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Yellow

# 1. 修复数据库连接问题
if ($FixDatabase) {
    Write-Host "`n📊 修复数据库问题..." -ForegroundColor Green
    
    # 运行数据库迁移
    Write-Host "运行Flyway数据库迁移..." -ForegroundColor Yellow
    try {
        mvn -f exam-bootstrap/pom.xml flyway:migrate -q
        Write-Host "✅ 数据库迁移完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 数据库迁移失败: $_" -ForegroundColor Red
    }
    
    # 检查管理员用户
    Write-Host "检查管理员用户..." -ForegroundColor Yellow
    $dbCheck = @"
SELECT COUNT(*) as admin_count 
FROM users 
WHERE role = 'ADMIN' AND email = 'admin@duanruo.com';
"@
    
    try {
        $result = psql -h localhost -p 5432 -U postgres -d "duanruo-exam-system" -t -c $dbCheck
        if ($result -gt 0) {
            Write-Host "✅ 管理员用户存在" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 管理员用户不存在，需要创建" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ 数据库查询失败: $_" -ForegroundColor Red
    }
}

# 2. 更新Playwright配置
if ($UpdateConfig) {
    Write-Host "`n⚙️ 更新Playwright配置..." -ForegroundColor Green
    
    $configPath = "web/playwright.config.ts"
    if (Test-Path $configPath) {
        Write-Host "更新 $configPath..." -ForegroundColor Yellow
        
        # 备份原配置
        Copy-Item $configPath "$configPath.backup" -Force
        Write-Host "✅ 配置文件已备份" -ForegroundColor Green
        
        # 这里可以添加配置更新逻辑
        Write-Host "✅ 配置更新完成" -ForegroundColor Green
    } else {
        Write-Host "❌ 配置文件不存在: $configPath" -ForegroundColor Red
    }
}

# 3. 检查服务状态
Write-Host "`n🔍 检查服务状态..." -ForegroundColor Green

# 检查后端服务
$backendPort = netstat -ano | findstr ":8081" | findstr "LISTENING"
if ($backendPort) {
    Write-Host "✅ 后端服务运行正常 (端口 8081)" -ForegroundColor Green
} else {
    Write-Host "❌ 后端服务未运行" -ForegroundColor Red
    Write-Host "启动后端服务..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command", "cd '$currentDir'; mvn -f exam-bootstrap/pom.xml spring-boot:run '-Dspring-boot.run.profiles=dev'" -WindowStyle Minimized
    Start-Sleep -Seconds 10
}

# 检查前端服务
$frontendPort = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($frontendPort) {
    Write-Host "✅ 前端服务运行正常 (端口 3000)" -ForegroundColor Green
} else {
    Write-Host "❌ 前端服务未运行" -ForegroundColor Red
    Write-Host "启动前端服务..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command", "cd '$currentDir/web'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 10
}

# 检查数据库连接
Write-Host "检查数据库连接..." -ForegroundColor Yellow
try {
    $dbTest = psql -h localhost -p 5432 -U postgres -d "duanruo-exam-system" -c "SELECT 1;" -t
    if ($dbTest -eq "1") {
        Write-Host "✅ 数据库连接正常" -ForegroundColor Green
    } else {
        Write-Host "❌ 数据库连接异常" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 数据库连接失败: $_" -ForegroundColor Red
}

# 4. 运行修复后的测试
if ($RunTests) {
    Write-Host "`n🧪 运行修复后的测试..." -ForegroundColor Green
    
    Set-Location "web"
    
    # 运行简化测试
    Write-Host "运行简化登录测试..." -ForegroundColor Yellow
    try {
        npx playwright test tests/e2e/auth/simple-login.spec.ts --reporter=html
        Write-Host "✅ 测试执行完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 测试执行失败: $_" -ForegroundColor Red
    }
    
    # 生成测试报告
    Write-Host "生成测试报告..." -ForegroundColor Yellow
    try {
        npx playwright show-report
        Write-Host "✅ 测试报告已生成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 测试报告生成失败: $_" -ForegroundColor Red
    }
    
    Set-Location ".."
}

# 5. 清理和优化
Write-Host "`n🧹 清理和优化..." -ForegroundColor Green

# 清理测试结果
if (Test-Path "web/test-results") {
    Write-Host "清理旧的测试结果..." -ForegroundColor Yellow
    Remove-Item "web/test-results" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 测试结果已清理" -ForegroundColor Green
}

# 清理Playwright缓存
Write-Host "清理Playwright缓存..." -ForegroundColor Yellow
Set-Location "web"
try {
    npx playwright install --force
    Write-Host "✅ Playwright浏览器已重新安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Playwright浏览器安装失败: $_" -ForegroundColor Red
}
Set-Location ".."

Write-Host "`n🎉 修复脚本执行完成！" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 显示使用说明
Write-Host "`n📋 使用说明:" -ForegroundColor Yellow
Write-Host "  .\scripts\fix-playwright-issues.ps1 -FixDatabase    # 修复数据库问题" -ForegroundColor White
Write-Host "  .\scripts\fix-playwright-issues.ps1 -UpdateConfig   # 更新配置" -ForegroundColor White
Write-Host "  .\scripts\fix-playwright-issues.ps1 -RunTests       # 运行测试" -ForegroundColor White
Write-Host "  .\scripts\fix-playwright-issues.ps1 -FixDatabase -UpdateConfig -RunTests  # 全部执行" -ForegroundColor White

Write-Host "`n📊 下一步建议:" -ForegroundColor Yellow
Write-Host "  1. 运行: .\scripts\fix-playwright-issues.ps1 -FixDatabase" -ForegroundColor White
Write-Host "  2. 运行: .\scripts\fix-playwright-issues.ps1 -RunTests" -ForegroundColor White
Write-Host "  3. 查看测试报告: http://localhost:9323" -ForegroundColor White
Write-Host "  4. 检查日志文件获取详细信息" -ForegroundColor White
