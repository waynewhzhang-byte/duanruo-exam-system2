# UI BDD 测试快速启动脚本
# 位置: 项目根目录
# 用法: .\run-ui-tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UI BDD 测试 - 快速启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 显示菜单
Write-Host "请选择要执行的测试:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. 运行所有UI测试（自动化模式）" -ForegroundColor White
Write-Host "  2. 运行所有UI测试（显示浏览器）" -ForegroundColor White
Write-Host "  3. 超级管理员测试" -ForegroundColor White
Write-Host "  4. 租户管理员测试" -ForegroundColor White
Write-Host "  5. 考生测试" -ForegroundColor White
Write-Host "  6. 审核员测试" -ForegroundColor White
Write-Host "  7. 调试模式" -ForegroundColor White
Write-Host "  8. 查看测试报告" -ForegroundColor White
Write-Host "  9. 检查服务状态" -ForegroundColor White
Write-Host "  0. 退出" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入选项 (0-9)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "[执行] 运行所有UI测试（自动化模式）..." -ForegroundColor Yellow
        cd web
        npm run test:ui-bdd:all
    }
    "2" {
        Write-Host ""
        Write-Host "[执行] 运行所有UI测试（显示浏览器）..." -ForegroundColor Yellow
        cd web
        npm run test:ui-bdd
    }
    "3" {
        Write-Host ""
        Write-Host "[执行] 超级管理员测试..." -ForegroundColor Yellow
        cd web
        npm run test:ui-bdd:super-admin
    }
    "4" {
        Write-Host ""
        Write-Host "[执行] 租户管理员测试..." -ForegroundColor Yellow
        cd web
        npm run test:ui-bdd:tenant-admin
    }
    "5" {
        Write-Host ""
        Write-Host "[执行] 考生测试..." -ForegroundColor Yellow
        cd web
        npm run test:ui-bdd:candidate
    }
    "6" {
        Write-Host ""
        Write-Host "[执行] 审核员测试..." -ForegroundColor Yellow
        cd web
        npm run test:ui-bdd:reviewer
    }
    "7" {
        Write-Host ""
        Write-Host "[执行] 调试模式..." -ForegroundColor Yellow
        cd web
        npm run test:ui-bdd:debug
    }
    "8" {
        Write-Host ""
        Write-Host "[查看] 测试报告..." -ForegroundColor Yellow
        cd web
        npm run test:e2e:report
    }
    "9" {
        Write-Host ""
        Write-Host "[检查] 服务状态..." -ForegroundColor Yellow
        Write-Host ""
        
        # 检查前端
        try {
            $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
            Write-Host "✅ 前端服务运行正常 (端口3000)" -ForegroundColor Green
        } catch {
            Write-Host "❌ 前端服务未运行 (端口3000)" -ForegroundColor Red
            Write-Host "   启动命令: cd web; npm run dev" -ForegroundColor Yellow
        }
        
        # 检查后端
        try {
            $backendResponse = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -Method GET -TimeoutSec 5 -UseBasicParsing
            Write-Host "✅ 后端服务运行正常 (端口8081)" -ForegroundColor Green
        } catch {
            Write-Host "❌ 后端服务未运行 (端口8081)" -ForegroundColor Red
            Write-Host "   启动命令: cd exam-bootstrap; mvn spring-boot:run" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "按任意键返回菜单..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        
        # 重新运行脚本
        & $MyInvocation.MyCommand.Path
    }
    "0" {
        Write-Host ""
        Write-Host "退出测试工具" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host ""
        Write-Host "❌ 无效选项，请重新运行脚本" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "查看更多信息:" -ForegroundColor Yellow
Write-Host "  - 测试指南: UI_BDD_TEST_GUIDE.md" -ForegroundColor Cyan
Write-Host "  - 详细文档: web/tests/e2e/ui-bdd/README.md" -ForegroundColor Cyan
Write-Host "  - 测试截图: web/test-results/*.png" -ForegroundColor Cyan
Write-Host ""

