# Export OpenAPI specification from running application
# Usage: powershell -ExecutionPolicy Bypass -File scripts/export-openapi.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenAPI Specification Export Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BASE_URL = "http://localhost:8081/api/v1"
$OUTPUT_DIR = "docs/openapi"
$JSON_FILE = "$OUTPUT_DIR/openapi-v1.json"
$YAML_FILE = "$OUTPUT_DIR/openapi-v1.yaml"
$WAIT_TIME = 30

# Check if application is already running
Write-Host "Checking if application is already running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/actuator/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    $alreadyRunning = $true
    Write-Host "✓ Application is already running" -ForegroundColor Green
}
catch {
    $alreadyRunning = $false
    Write-Host "✗ Application is not running" -ForegroundColor Yellow
}

$process = $null

if (-not $alreadyRunning) {
    Write-Host ""
    Write-Host "Starting backend service..." -ForegroundColor Green
    Write-Host "Command: mvn spring-boot:run -pl exam-bootstrap" -ForegroundColor Gray

    # Change to project root directory
    $projectRoot = Split-Path -Parent $PSScriptRoot
    Push-Location $projectRoot

    # Start the application in background
    $process = Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$projectRoot' ; mvn spring-boot:run -pl exam-bootstrap"
    ) -PassThru

    Pop-Location

    Write-Host "Process ID: $($process.Id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Waiting $WAIT_TIME seconds for application to start..." -ForegroundColor Yellow

    # Wait with progress indicator
    for ($i = 1; $i -le $WAIT_TIME; $i++) {
        Write-Progress -Activity "Starting Application" -Status "Please wait..." -PercentComplete (($i / $WAIT_TIME) * 100)
        Start-Sleep -Seconds 1
    }
    Write-Progress -Activity "Starting Application" -Completed

    # Verify application is running
    Write-Host "Verifying application health..." -ForegroundColor Yellow
    $retries = 10
    $healthy = $false

    for ($i = 1; $i -le $retries; $i++) {
        try {
            $healthResponse = Invoke-WebRequest -Uri "$BASE_URL/v3/api-docs" -TimeoutSec 5 -ErrorAction Stop
            if ($healthResponse.StatusCode -eq 200) {
                $healthy = $true
                Write-Host "✓ Application is healthy and OpenAPI endpoint is ready" -ForegroundColor Green
                break
            }
        }
        catch {
            Write-Host "Retry $i/$retries - Application not ready yet..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }

    if (-not $healthy) {
        Write-Host "✗ Application failed to start properly" -ForegroundColor Red
        Write-Host "Please check the application logs in the other PowerShell window" -ForegroundColor Yellow
        if ($process) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Exporting OpenAPI Specification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Create output directory if it doesn't exist
    if (-not (Test-Path $OUTPUT_DIR)) {
        New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null
        Write-Host "Created output directory: $OUTPUT_DIR" -ForegroundColor Gray
    }
    
    # Export JSON format
    Write-Host "Exporting OpenAPI JSON..." -ForegroundColor Green
    Write-Host "  URL: $BASE_URL/v3/api-docs" -ForegroundColor Gray
    Write-Host "  Output: $JSON_FILE" -ForegroundColor Gray
    
    $jsonResponse = Invoke-WebRequest -Uri "$BASE_URL/v3/api-docs" -TimeoutSec 30
    $jsonResponse.Content | Out-File -FilePath $JSON_FILE -Encoding UTF8
    
    Write-Host "✓ JSON exported successfully" -ForegroundColor Green
    Write-Host "  Size: $((Get-Item $JSON_FILE).Length) bytes" -ForegroundColor Gray
    
    # Export YAML format
    Write-Host ""
    Write-Host "Exporting OpenAPI YAML..." -ForegroundColor Green
    Write-Host "  URL: $BASE_URL/v3/api-docs.yaml" -ForegroundColor Gray
    Write-Host "  Output: $YAML_FILE" -ForegroundColor Gray
    
    try {
        $yamlResponse = Invoke-WebRequest -Uri "$BASE_URL/v3/api-docs.yaml" -TimeoutSec 30
        $yamlResponse.Content | Out-File -FilePath $YAML_FILE -Encoding UTF8
        
        Write-Host "✓ YAML exported successfully" -ForegroundColor Green
        Write-Host "  Size: $((Get-Item $YAML_FILE).Length) bytes" -ForegroundColor Gray
    }
    catch {
        Write-Host "⚠ YAML export failed (this is optional): $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Export Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✓ OpenAPI specification exported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Files created:" -ForegroundColor Cyan
    Write-Host "  - JSON: $JSON_FILE" -ForegroundColor White
    if (Test-Path $YAML_FILE) {
        Write-Host "  - YAML: $YAML_FILE" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review the exported files" -ForegroundColor White
    Write-Host "  2. Commit the changes to Git" -ForegroundColor White
    Write-Host "  3. View Swagger UI at: $BASE_URL/swagger-ui.html" -ForegroundColor White
    Write-Host ""
    
    # Validate JSON format
    Write-Host "Validating JSON format..." -ForegroundColor Yellow
    try {
        $jsonContent = Get-Content $JSON_FILE -Raw | ConvertFrom-Json
        Write-Host "✓ JSON format is valid" -ForegroundColor Green
        Write-Host "  OpenAPI Version: $($jsonContent.openapi)" -ForegroundColor Gray
        Write-Host "  API Title: $($jsonContent.info.title)" -ForegroundColor Gray
        Write-Host "  API Version: $($jsonContent.info.version)" -ForegroundColor Gray
        Write-Host "  Endpoints: $($jsonContent.paths.PSObject.Properties.Count)" -ForegroundColor Gray
    }
    catch {
        Write-Host "⚠ JSON validation failed: $_" -ForegroundColor Yellow
    }
}
catch {
    Write-Host ""
    Write-Host "✗ Error exporting OpenAPI specification:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if (-not $alreadyRunning -and $process) {
        Write-Host "Stopping backend service..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}
finally {
    if (-not $alreadyRunning -and $process) {
        Write-Host ""
        Write-Host "Stopping backend service..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Backend service stopped" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Export Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

