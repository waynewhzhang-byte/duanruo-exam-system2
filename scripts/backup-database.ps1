# PostgreSQL数据库备份脚本
# 用于备份考试报名系统的数据库

param(
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$Host = "localhost",
    [int]$Port = 5432,
    [string]$Username = "postgres",
    [string]$BackupDir = "D:\backups\exam-system",
    [switch]$Compress = $true,
    [switch]$IncludeSchemas = $true
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 创建备份目录
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "Created backup directory: $BackupDir" -ForegroundColor Green
}

# 生成备份文件名（包含时间戳）
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "$DatabaseName`_$timestamp.sql"
$compressedFile = "$backupFile.gz"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Backup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database: $DatabaseName" -ForegroundColor Yellow
Write-Host "Host: $Host`:$Port" -ForegroundColor Yellow
Write-Host "Backup File: $backupFile" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# 设置PostgreSQL密码环境变量（避免交互式输入）
# 注意：生产环境应该使用更安全的方式（如.pgpass文件）
$env:PGPASSWORD = Read-Host "Enter PostgreSQL password" -AsSecureString | ConvertFrom-SecureString

try {
    # 执行备份
    Write-Host "`nStarting backup..." -ForegroundColor Green
    
    $pgDumpArgs = @(
        "-h", $Host,
        "-p", $Port,
        "-U", $Username,
        "-F", "p",  # Plain text format
        "-b",       # Include large objects
        "-v",       # Verbose
        "-f", $backupFile,
        $DatabaseName
    )
    
    if ($IncludeSchemas) {
        Write-Host "Including all schemas..." -ForegroundColor Yellow
    }
    
    # 执行pg_dump
    & pg_dump @pgDumpArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    
    # 获取备份文件大小
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host "Backup file size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Yellow
    
    # 压缩备份文件
    if ($Compress) {
        Write-Host "`nCompressing backup file..." -ForegroundColor Green
        
        # 使用7-Zip压缩（如果可用）
        if (Get-Command "7z" -ErrorAction SilentlyContinue) {
            & 7z a -tgzip $compressedFile $backupFile
            
            if ($LASTEXITCODE -eq 0) {
                # 删除原始备份文件
                Remove-Item $backupFile -Force
                
                $compressedSize = (Get-Item $compressedFile).Length / 1MB
                Write-Host "Compressed file size: $([math]::Round($compressedSize, 2)) MB" -ForegroundColor Yellow
                Write-Host "Compression ratio: $([math]::Round(($compressedSize / $fileSize) * 100, 2))%" -ForegroundColor Yellow
            }
        } else {
            Write-Host "7-Zip not found, skipping compression" -ForegroundColor Yellow
        }
    }
    
    # 清理旧备份（保留最近30天）
    Write-Host "`nCleaning up old backups..." -ForegroundColor Green
    $cutoffDate = (Get-Date).AddDays(-30)
    $oldBackups = Get-ChildItem -Path $BackupDir -Filter "$DatabaseName`_*.sql*" | 
                  Where-Object { $_.LastWriteTime -lt $cutoffDate }
    
    if ($oldBackups) {
        foreach ($oldBackup in $oldBackups) {
            Remove-Item $oldBackup.FullName -Force
            Write-Host "Deleted old backup: $($oldBackup.Name)" -ForegroundColor Gray
        }
        Write-Host "Deleted $($oldBackups.Count) old backup(s)" -ForegroundColor Yellow
    } else {
        Write-Host "No old backups to delete" -ForegroundColor Yellow
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "Backup failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
} finally {
    # 清除密码环境变量
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# 显示备份文件列表
Write-Host "`nRecent backups:" -ForegroundColor Cyan
Get-ChildItem -Path $BackupDir -Filter "$DatabaseName`_*.sql*" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 | 
    Format-Table Name, @{Label="Size (MB)"; Expression={[math]::Round($_.Length / 1MB, 2)}}, LastWriteTime -AutoSize

