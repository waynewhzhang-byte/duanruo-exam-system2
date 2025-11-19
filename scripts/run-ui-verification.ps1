# UI功能验证脚本 - 使用Chrome DevTools
# 用途: 通过浏览器手动验证核心功能

param(
    [string]$TestType = "all"  # all, login, tenant, exam, registration, review, payment
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UI功能验证 - Chrome DevTools" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 验证环境
Write-Host "验证环境..." -ForegroundColor Yellow
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/actuator/health" -TimeoutSec 3
    Write-Host "  ✓ 后端服务: $($backend.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 后端服务未运行" -ForegroundColor Red
    exit 1
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing
    Write-Host "  ✓ 前端服务: 运行中" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 前端服务未运行" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  测试场景清单" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 定义测试场景
$testScenarios = @{
    "login" = @{
        "name" = "用户登录和租户选择"
        "url" = "http://localhost:3000/login"
        "steps" = @(
            "1. 使用超级管理员登录 (super_admin / SuperAdmin123!@#)",
            "2. 验证登录成功",
            "3. 如果有多个租户,验证租户选择页面",
            "4. 选择租户并进入系统",
            "5. 验证用户信息显示正确"
        )
        "expected" = "成功登录并进入系统首页"
    }
    "tenant" = @{
        "name" = "租户管理"
        "url" = "http://localhost:3000/super-admin/tenants"
        "steps" = @(
            "1. 以超级管理员身份登录",
            "2. 访问租户管理页面",
            "3. 查看租户列表",
            "4. 创建新租户 (测试租户)",
            "5. 编辑租户信息",
            "6. 验证租户状态切换"
        )
        "expected" = "能够完整管理租户生命周期"
    }
    "exam" = @{
        "name" = "考试创建和管理"
        "url" = "http://localhost:3000/tenant-admin/exams"
        "steps" = @(
            "1. 以租户管理员身份登录",
            "2. 访问考试管理页面",
            "3. 创建新考试",
            "4. 配置考试基本信息",
            "5. 添加考试岗位",
            "6. 配置报名表单",
            "7. 发布考试"
        )
        "expected" = "成功创建并发布考试"
    }
    "registration" = @{
        "name" = "考生报名"
        "url" = "http://localhost:3000/candidate/exams"
        "steps" = @(
            "1. 以考生身份登录",
            "2. 浏览可报名考试",
            "3. 选择考试和岗位",
            "4. 填写报名表单",
            "5. 上传附件材料",
            "6. 提交报名",
            "7. 查看报名状态"
        )
        "expected" = "成功提交报名申请"
    }
    "review" = @{
        "name" = "报名审核"
        "url" = "http://localhost:3000/reviewer/applications"
        "steps" = @(
            "1. 以审核员身份登录",
            "2. 查看待审核列表",
            "3. 查看报名详情",
            "4. 审核附件材料",
            "5. 填写审核意见",
            "6. 提交审核结果",
            "7. 验证审核状态更新"
        )
        "expected" = "成功完成报名审核"
    }
    "payment" = @{
        "name" = "报名缴费"
        "url" = "http://localhost:3000/candidate/applications"
        "steps" = @(
            "1. 以考生身份登录",
            "2. 查看已审核通过的报名",
            "3. 点击缴费按钮",
            "4. 选择支付方式",
            "5. 完成支付流程",
            "6. 验证支付状态",
            "7. 下载准考证"
        )
        "expected" = "成功完成缴费并获取准考证"
    }
}

# 根据参数选择测试场景
$selectedScenarios = @{}
if ($TestType -eq "all") {
    $selectedScenarios = $testScenarios
} elseif ($testScenarios.ContainsKey($TestType)) {
    $selectedScenarios[$TestType] = $testScenarios[$TestType]
} else {
    Write-Host "无效的测试类型: $TestType" -ForegroundColor Red
    Write-Host "可用类型: all, login, tenant, exam, registration, review, payment" -ForegroundColor Yellow
    exit 1
}

# 显示测试场景
$index = 1
foreach ($key in $selectedScenarios.Keys) {
    $scenario = $selectedScenarios[$key]
    Write-Host "[$index] $($scenario.name)" -ForegroundColor Cyan
    Write-Host "    URL: $($scenario.url)" -ForegroundColor Gray
    Write-Host "    测试步骤:" -ForegroundColor Yellow
    foreach ($step in $scenario.steps) {
        Write-Host "      $step" -ForegroundColor White
    }
    Write-Host "    预期结果: $($scenario.expected)" -ForegroundColor Green
    Write-Host ""
    $index++
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  开始测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "即将打开浏览器进行手动测试..." -ForegroundColor Yellow
Write-Host "请按照上述步骤进行验证,并记录测试结果" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键打开浏览器..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 打开浏览器
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "浏览器已打开!" -ForegroundColor Green
Write-Host "请在浏览器中完成测试,并记录结果" -ForegroundColor Yellow
Write-Host ""

