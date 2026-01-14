# Apply files table fix to tenant schema
# This script fixes the files table schema to match FileEntity

param(
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432,
    [string]$DatabaseName = "duanruo-exam-system",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "postgres",
    [string]$SchemaName = "tenant_duanruotest3"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Applying files table fix to schema: $SchemaName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$env:PGPASSWORD = $DatabasePassword

# Read the migration SQL file
$migrationFile = Join-Path $PSScriptRoot "..\exam-infrastructure\src\main\resources\db\tenant-migration\V018__Fix_files_table_columns.sql"
$migrationSql = Get-Content $migrationFile -Raw

$sql = @"
SET search_path TO "$SchemaName", public;

$migrationSql

-- Show current columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = '$SchemaName' AND table_name = 'files'
ORDER BY ordinal_position;
"@

Write-Host "Executing SQL..." -ForegroundColor Yellow
$result = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c $sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success!" -ForegroundColor Green
    Write-Host $result
} else {
    Write-Host "Error: $result" -ForegroundColor Red
}

$env:PGPASSWORD = $null

