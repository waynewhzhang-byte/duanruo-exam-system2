#!/usr/bin/env pwsh

<#
.SYNOPSIS
    运行端到端测试的完整脚本

.DESCRIPTION
    这个脚本会：
    1. 检查并启动PostgreSQL数据库
    2. 启动后端Spring Boot应用
    3. 启动前端Next.js应用
    4. 运行Playwright端到端测试
    5. 生成测试报告

.PARAMETER TestPattern
    要运行的测试模式，默认运行所有测试

.PARAMETER Headed
    是否在有头模式下运行测试（显示浏览器窗口）

.PARAMETER Debug
    是否在调试模式下运行测试

.PARAMETER UI
    是否使用Playwright UI模式运行测试

.EXAMPLE
    .\scripts\run-e2e-tests.ps1
    运行所有端到端测试

.EXAMPLE
    .\scripts\run-e2e-tests.ps1 -TestPattern "admin-login" -Headed
    运行管理员登录测试，显示浏览器窗口

.EXAMPLE
    .\scripts\run-e2e-tests.ps1 -UI
    使用Playwright UI模式运行测试
#>

param(
    [string]$TestPattern = "",
    [switch]$Headed = $false,
    [switch]$Debug = $false,
    [switch]$UI = $false,
    [switch]$SkipServices = $false
)

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }

# 检查端口是否被占用
function Test-Port {
    param([int]$Port)
    
    try {
        $result = netstat -ano | findstr ":$Port"
        return $result -match "LISTENING"
    }
    catch {
        return $false
    }
}

# 等待端口可用
function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )
    
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    
    while ((Get-Date) -lt $timeout) {
        if (Test-Port -Port $Port) {
            Write-Success "端口 $Port 已可用"
            return $true
        }
        
        Write-Info "等待端口 $Port 可用..."
        Start-Sleep -Seconds 2
    }
    
    Write-Error "等待端口 $Port 超时"
    return $false
}

# 检查PostgreSQL服务
function Test-PostgreSQL {
    Write-Info "检查PostgreSQL服务..."
    
    try {
        $service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
        if ($service -and $service.Status -eq "Running") {
            Write-Success "PostgreSQL服务正在运行"
            return $true
        }
        else {
            Write-Warning "PostgreSQL服务未运行，尝试启动..."
            # 尝试启动服务
            if ($service) {
                Start-Service $service.Name
                Write-Success "PostgreSQL服务已启动"
                return $true
            }
            else {
                Write-Error "未找到PostgreSQL服务"
                return $false
            }
        }
    }
    catch {
        Write-Error "检查PostgreSQL服务失败: $_"
        return $false
    }
}

# 启动后端服务
function Start-Backend {
    Write-Info "检查后端服务状态..."
    
    if (Test-Port -Port 8081) {
        Write-Success "后端服务已在运行 (端口 8081)"
        return $true
    }
    
    Write-Info "启动后端服务..."
    
    # 使用已有的启动脚本
    $backendScript = Join-Path $PSScriptRoot "start-backend.ps1"
    
    if (Test-Path $backendScript) {
        # 在后台启动后端
        $job = Start-Job -ScriptBlock {
            param($scriptPath)
            & $scriptPath
        } -ArgumentList $backendScript
        
        Write-Info "后端启动作业ID: $($job.Id)"
        
        # 等待后端启动
        if (Wait-ForPort -Port 8081 -TimeoutSeconds 120) {
            Write-Success "后端服务启动成功"
            return $true
        }
        else {
            Write-Error "后端服务启动失败"
            return $false
        }
    }
    else {
        Write-Error "未找到后端启动脚本: $backendScript"
        return $false
    }
}

# 启动前端服务
function Start-Frontend {
    Write-Info "检查前端服务状态..."
    
    if (Test-Port -Port 3000) {
        Write-Success "前端服务已在运行 (端口 3000)"
        return $true
    }
    
    Write-Info "启动前端服务..."
    
    # 切换到web目录并启动前端
    Push-Location (Join-Path $PSScriptRoot "..\web")
    
    try {
        # 在后台启动前端
        $job = Start-Job -ScriptBlock {
            param($webPath)
            Set-Location $webPath
            npm run dev
        } -ArgumentList (Get-Location).Path
        
        Write-Info "前端启动作业ID: $($job.Id)"
        
        # 等待前端启动
        if (Wait-ForPort -Port 3000 -TimeoutSeconds 60) {
            Write-Success "前端服务启动成功"
            return $true
        }
        else {
            Write-Error "前端服务启动失败"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# 运行测试
function Start-Tests {
    Write-Info "运行Playwright端到端测试..."
    
    Push-Location (Join-Path $PSScriptRoot "..\web")
    
    try {
        # 构建测试命令
        $testCommand = "npx playwright test"
        
        if ($TestPattern) {
            $testCommand += " --grep `"$TestPattern`""
        }
        
        if ($Headed) {
            $testCommand += " --headed"
        }
        
        if ($Debug) {
            $testCommand += " --debug"
        }
        
        if ($UI) {
            $testCommand += " --ui"
        }
        
        Write-Info "执行命令: $testCommand"
        
        # 执行测试
        Invoke-Expression $testCommand
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "测试执行完成"
            
            # 显示测试报告
            Write-Info "生成测试报告..."
            npx playwright show-report
        }
        else {
            Write-Error "测试执行失败，退出代码: $LASTEXITCODE"
        }
        
        return $LASTEXITCODE -eq 0
    }
    finally {
        Pop-Location
    }
}

# 主执行流程
function Main {
    Write-Info "开始端到端测试流程..."
    Write-Info "参数: TestPattern='$TestPattern', Headed=$Headed, Debug=$Debug, UI=$UI, SkipServices=$SkipServices"
    
    if (-not $SkipServices) {
        # 1. 检查数据库
        if (-not (Test-PostgreSQL)) {
            Write-Error "数据库检查失败，无法继续测试"
            exit 1
        }
        
        # 2. 启动后端
        if (-not (Start-Backend)) {
            Write-Error "后端启动失败，无法继续测试"
            exit 1
        }
        
        # 3. 启动前端
        if (-not (Start-Frontend)) {
            Write-Error "前端启动失败，无法继续测试"
            exit 1
        }
        
        # 4. 等待服务稳定
        Write-Info "等待服务稳定..."
        Start-Sleep -Seconds 10
    }
    else {
        Write-Warning "跳过服务启动，假设服务已在运行"
    }
    
    # 5. 运行测试
    $testSuccess = Start-Tests
    
    if ($testSuccess) {
        Write-Success "端到端测试完成！"
        exit 0
    }
    else {
        Write-Error "端到端测试失败！"
        exit 1
    }
}

# 执行主流程
Main
