# Fix file casing issues by direct file system operations
# This script renames files using a two-step process to handle case-sensitive renames on Windows

$ErrorActionPreference = "Stop"

# List of files to rename (from uppercase to lowercase)
$filesToRename = @(
    @{Name = "Badge"},
    @{Name = "Button"},
    @{Name = "Card"},
    @{Name = "Form"},
    @{Name = "Input"},
    @{Name = "Label"},
    @{Name = "Table"},
    @{Name = "Textarea"}
)

$basePath = "web\src\components\ui"

Write-Host "Starting file casing fix..." -ForegroundColor Green
Write-Host "Base path: $basePath" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $filesToRename) {
    $fileName = $file.Name
    $upperFile = Join-Path $basePath "$fileName.tsx"
    $lowerFile = Join-Path $basePath "$($fileName.ToLower()).tsx"
    $tempFile = Join-Path $basePath "$fileName-TEMP-RENAME.tsx"
    
    Write-Host "Processing: $fileName.tsx" -ForegroundColor Cyan
    
    # Check if uppercase file exists
    if (Test-Path $upperFile) {
        try {
            # Step 1: Rename to temporary name
            Write-Host "  Step 1: $upperFile -> $tempFile" -ForegroundColor Gray
            Move-Item -Path $upperFile -Destination $tempFile -Force
            
            # Step 2: Rename to lowercase
            Write-Host "  Step 2: $tempFile -> $lowerFile" -ForegroundColor Gray
            Move-Item -Path $tempFile -Destination $lowerFile -Force
            
            Write-Host "  ✓ Successfully renamed to lowercase" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ Error: $_" -ForegroundColor Red
            
            # Try to recover if temp file exists
            if (Test-Path $tempFile) {
                Write-Host "  Attempting to recover..." -ForegroundColor Yellow
                Move-Item -Path $tempFile -Destination $upperFile -Force
            }
        }
    } else {
        Write-Host "  ℹ Uppercase file not found, checking lowercase..." -ForegroundColor Yellow
        
        if (Test-Path $lowerFile) {
            Write-Host "  ✓ Lowercase file already exists" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Neither uppercase nor lowercase file found!" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "Verifying final state..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $filesToRename) {
    $fileName = $file.Name
    $lowerFile = Join-Path $basePath "$($fileName.ToLower()).tsx"
    
    if (Test-Path $lowerFile) {
        Write-Host "✓ $($fileName.ToLower()).tsx exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $($fileName.ToLower()).tsx NOT FOUND!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "File casing fix completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Rebuild the project" -ForegroundColor Yellow
Write-Host "  cd web && npm run build" -ForegroundColor White

