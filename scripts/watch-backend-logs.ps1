# 监控后端日志脚本
# 用法: .\scripts\watch-backend-logs.ps1 [日志文件路径]

Param(
    [string]$LogFile = "backend-live.log"
)

$ErrorActionPreference = "Continue"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$logPath = Join-Path $repoRoot $LogFile

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  后端日志监控工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "日志文件: $logPath" -ForegroundColor Yellow
Write-Host "按 Ctrl+C 退出监控" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 如果日志文件不存在，等待创建
if (-not (Test-Path $logPath)) {
    Write-Host "等待日志文件创建..." -ForegroundColor Yellow
    $timeout = 30
    $elapsed = 0
    while (-not (Test-Path $logPath) -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    Write-Host ""
    if (-not (Test-Path $logPath)) {
        Write-Error "日志文件未创建，请确保后端已启动"
        exit 1
    }
}

# 读取已有内容（最后50行）
if (Test-Path $logPath) {
    $existingLines = Get-Content $logPath -Tail 50 -ErrorAction SilentlyContinue
    if ($existingLines) {
        Write-Host "=== 最近的日志内容 ===" -ForegroundColor Green
        $existingLines | ForEach-Object { Write-Host $_ }
        Write-Host "=== 开始实时监控 ===" -ForegroundColor Green
        Write-Host ""
    }
}

# 获取初始文件大小
$lastSize = (Get-Item $logPath).Length
$lastPosition = $lastSize

# 持续监控
try {
    while ($true) {
        if (Test-Path $logPath) {
            $currentSize = (Get-Item $logPath).Length
            
            # 如果文件大小增加，读取新内容
            if ($currentSize -gt $lastPosition) {
                $stream = [System.IO.File]::Open($logPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
                $stream.Position = $lastPosition
                $reader = New-Object System.IO.StreamReader($stream)
                
                while (-not $reader.EndOfStream) {
                    $line = $reader.ReadLine()
                    if ($line) {
                        # 根据日志级别着色
                        if ($line -match "ERROR|Exception|Failed|失败") {
                            Write-Host $line -ForegroundColor Red
                        }
                        elseif ($line -match "WARN|警告") {
                            Write-Host $line -ForegroundColor Yellow
                        }
                        elseif ($line -match "INFO|信息") {
                            Write-Host $line -ForegroundColor Cyan
                        }
                        elseif ($line -match "DEBUG|调试") {
                            Write-Host $line -ForegroundColor Gray
                        }
                        else {
                            Write-Host $line
                        }
                    }
                }
                
                $reader.Close()
                $stream.Close()
                $lastPosition = $currentSize
            }
        }
        
        Start-Sleep -Milliseconds 500
    }
}
catch {
    Write-Host "`n监控已停止: $($_.Exception.Message)" -ForegroundColor Yellow
}
finally {
    Write-Host "`n日志监控已退出" -ForegroundColor Gray
}

