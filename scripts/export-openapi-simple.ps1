# Simple OpenAPI Export Script
# Prerequisites: Application must be running at http://localhost:8081
# Usage: powershell -ExecutionPolicy Bypass -File scripts/export-openapi-simple.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenAPI Specification Export Tool" -ForegroundColor Cyan
Write-Host "  (Simple Version)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BASE_URL = "http://localhost:8081/api/v1"
$OUTPUT_DIR = "docs/openapi"
$JSON_FILE = "$OUTPUT_DIR/openapi-v1.json"
$YAML_FILE = "$OUTPUT_DIR/openapi-v1.yaml"

# Check if application is running
Write-Host "Checking if application is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/v3/api-docs" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Application is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ Application is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the application first:" -ForegroundColor Yellow
    Write-Host "  1. Open a new PowerShell window" -ForegroundColor White
    Write-Host "  2. Navigate to project directory: cd d:\duanruo-exam-system2" -ForegroundColor White
    Write-Host "  3. Run: mvn spring-boot:run -pl exam-bootstrap" -ForegroundColor White
    Write-Host "  4. Wait for application to start (look for 'Started ExamBootstrapApplication')" -ForegroundColor White
    Write-Host "  5. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
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
    
    # Validate JSON format
    Write-Host "Validating JSON format..." -ForegroundColor Yellow
    try {
        $jsonContent = Get-Content $JSON_FILE -Raw | ConvertFrom-Json
        Write-Host "✓ JSON format is valid" -ForegroundColor Green
        Write-Host ""
        Write-Host "API Information:" -ForegroundColor Cyan
        Write-Host "  OpenAPI Version: $($jsonContent.openapi)" -ForegroundColor White
        Write-Host "  API Title: $($jsonContent.info.title)" -ForegroundColor White
        Write-Host "  API Version: $($jsonContent.info.version)" -ForegroundColor White
        Write-Host "  Total Endpoints: $($jsonContent.paths.PSObject.Properties.Count)" -ForegroundColor White
        
        # Count endpoints by tag
        Write-Host ""
        Write-Host "Endpoints by Category:" -ForegroundColor Cyan
        $tagCounts = @{}
        foreach ($path in $jsonContent.paths.PSObject.Properties) {
            foreach ($method in $path.Value.PSObject.Properties) {
                if ($method.Value.tags) {
                    foreach ($tag in $method.Value.tags) {
                        if (-not $tagCounts.ContainsKey($tag)) {
                            $tagCounts[$tag] = 0
                        }
                        $tagCounts[$tag]++
                    }
                }
            }
        }
        foreach ($tag in $tagCounts.Keys | Sort-Object) {
            Write-Host "  - $tag: $($tagCounts[$tag])" -ForegroundColor White
        }
    }
    catch {
        Write-Host "⚠ JSON validation failed: $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review the exported files" -ForegroundColor White
    Write-Host "  2. Commit the changes to Git:" -ForegroundColor White
    Write-Host "     git add docs/openapi/" -ForegroundColor Gray
    Write-Host "     git commit -m 'docs: update OpenAPI specification'" -ForegroundColor Gray
    Write-Host "  3. View Swagger UI at: $BASE_URL/swagger-ui.html" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "✗ Error exporting OpenAPI specification:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Export Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

