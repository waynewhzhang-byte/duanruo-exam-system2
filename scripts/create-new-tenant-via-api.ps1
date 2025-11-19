# PowerShell script to create a new tenant via API

$baseUrl = "http://localhost:8081/api/v1"

# Step 1: Login as tenant_admin
Write-Host "Step 1: Logging in as tenant_admin..." -ForegroundColor Cyan

$loginBody = @{
    username = "tenant_admin"
    password = "TenantAdmin123!@#"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    $token = $loginResponse.token
    Write-Host "✓ Login successful! Token: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# Step 2: Create new tenant
Write-Host "`nStep 2: Creating new tenant 'test-company-b'..." -ForegroundColor Cyan

$createTenantBody = @{
    name = "测试企业B"
    code = "test-company-b"
    contactEmail = "admin@test-b.com"
    contactPhone = "13900139001"
    description = "第二个测试租户，用于验证tenant-migration脚本"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/tenants" `
        -Method POST `
        -Headers $headers `
        -Body $createTenantBody `
        -ErrorAction Stop
    
    Write-Host "✓ Tenant created successfully!" -ForegroundColor Green
    Write-Host "Tenant ID: $($createResponse.id)" -ForegroundColor Yellow
    Write-Host "Tenant Name: $($createResponse.name)" -ForegroundColor Yellow
    Write-Host "Tenant Code: $($createResponse.slug)" -ForegroundColor Yellow
    Write-Host "Schema Name: tenant_$($createResponse.slug)" -ForegroundColor Yellow
    
    # Step 3: Verify tenant schema was created
    Write-Host "`nStep 3: Verifying tenant schema was created..." -ForegroundColor Cyan
    
    $env:PGPASSWORD = "zww0625wh"
    $schemaName = "tenant_$($createResponse.slug)"
    
    $verifyQuery = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = '$schemaName' 
ORDER BY table_name;
"@
    
    $tables = & psql -h localhost -p 5432 -U postgres -d duanruo-exam-system -t -A -c $verifyQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Schema verification successful!" -ForegroundColor Green
        Write-Host "Tables in schema '$schemaName':" -ForegroundColor Yellow
        $tables -split "`n" | Where-Object { $_ -ne "" } | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Gray
        }
        
        $tableCount = ($tables -split "`n" | Where-Object { $_ -ne "" }).Count
        Write-Host "`nTotal tables: $tableCount" -ForegroundColor Yellow
        
        if ($tableCount -ge 19) {
            Write-Host "✓ All expected tables created (including V006-V010)!" -ForegroundColor Green
        } else {
            Write-Host "⚠ Warning: Expected 19 tables, but found $tableCount" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Schema verification failed" -ForegroundColor Red
        Write-Host "Error: $tables" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Tenant creation failed: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n=== Tenant Creation Complete ===" -ForegroundColor Green

