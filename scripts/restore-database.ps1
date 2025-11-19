# PostgreSQL数据库恢复脚本
# 用于恢复考试报名系统的数据库

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$DatabaseHost = "localhost",
    [int]$Port = 5432,
    [string]$Username = "postgres",
    [switch]$DropExisting = $false,
    [switch]$CreateDatabase = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 检查备份文件是否存在
if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# 如果是压缩文件，先解压
$sqlFile = $BackupFile
if ($BackupFile -match "\.gz$") {
    Write-Host "Decompressing backup file..." -ForegroundColor Yellow
    $sqlFile = $BackupFile -replace "\.gz$", ""
    
    if (Get-Command "7z" -ErrorAction SilentlyContinue) {
        & 7z x -y $BackupFile -o"$(Split-Path $BackupFile)"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to decompress backup file"
        }
    } else {
        Write-Host "Error: 7-Zip not found, cannot decompress file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Restore Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database: $DatabaseName" -ForegroundColor Yellow
Write-Host "Host: $DatabaseHost`:$Port" -ForegroundColor Yellow
Write-Host "Backup File: $sqlFile" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# 确认操作
if ($DropExisting) {
    Write-Host "`nWARNING: This will DROP the existing database!" -ForegroundColor Red
    $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "Operation cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# 设置PostgreSQL密码环境变量
$env:PGPASSWORD = Read-Host "Enter PostgreSQL password" -AsSecureString | ConvertFrom-SecureString

try {
    # 删除现有数据库（如果指定）
    if ($DropExisting) {
        Write-Host "`nDropping existing database..." -ForegroundColor Yellow
        
        # 断开所有连接
        $disconnectQuery = @"
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DatabaseName'
  AND pid <> pg_backend_pid();
"@
        
        & psql -h $DatabaseHost -p $Port -U $Username -d postgres -c $disconnectQuery

        # 删除数据库
        & psql -h $DatabaseHost -p $Port -U $Username -d postgres -c "DROP DATABASE IF EXISTS `"$DatabaseName`";"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to drop database"
        }
        
        Write-Host "Database dropped successfully" -ForegroundColor Green
    }
    
    # 创建数据库（如果指定）
    if ($CreateDatabase) {
        Write-Host "`nCreating database..." -ForegroundColor Yellow
        & psql -h $DatabaseHost -p $Port -U $Username -d postgres -c "CREATE DATABASE `"$DatabaseName`";"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create database"
        }
        
        Write-Host "Database created successfully" -ForegroundColor Green
    }
    
    # 执行恢复
    Write-Host "`nStarting restore..." -ForegroundColor Green
    
    $psqlArgs = @(
        "-h", $DatabaseHost,
        "-p", $Port,
        "-U", $Username,
        "-d", $DatabaseName,
        "-f", $sqlFile,
        "-v", "ON_ERROR_STOP=1"
    )
    
    & psql @psqlArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "psql failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Restore completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "Restore failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
} finally {
    # 清除密码环境变量
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    
    # 如果解压了文件，删除临时SQL文件
    if ($BackupFile -match "\.gz$" -and (Test-Path $sqlFile)) {
        Remove-Item $sqlFile -Force
    }
}

