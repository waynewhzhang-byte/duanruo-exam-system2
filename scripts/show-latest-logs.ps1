# 快速查看最新日志
# 用法: .\scripts\show-latest-logs.ps1 [行数，默认20]

Param(
    [int]$Lines = 20
)

$ErrorActionPreference = "Continue"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$logFile = Join-Path $repoRoot "backend-live.log"

if (-not (Test-Path $logFile)) {
    Write-Host "日志文件不存在: $logFile" -ForegroundColor Red
    Write-Host "请确保后端已启动" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== 后端最新日志 (最后 $Lines 行) ===" -ForegroundColor Cyan
Write-Host "日志文件: $logFile" -ForegroundColor Gray
Write-Host "最后更新: $((Get-Item $logFile).LastWriteTime)" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Get-Content $logFile -Tail $Lines | ForEach-Object {
    if ($_ -match "ERROR|Exception|Failed|失败") {
        Write-Host $_ -ForegroundColor Red
    }
    elseif ($_ -match "WARN|警告") {
        Write-Host $_ -ForegroundColor Yellow
    }
    elseif ($_ -match "INFO") {
        Write-Host $_ -ForegroundColor Cyan
    }
    elseif ($_ -match "DEBUG") {
        Write-Host $_ -ForegroundColor Gray
    }
    else {
        Write-Host $_
    }
}

