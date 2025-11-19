# Fix file casing issues by renaming files through Git
# This script uses a two-step rename process to handle case-sensitive renames on Windows

$ErrorActionPreference = "Continue"

# List of files to rename (from uppercase to lowercase)
$filesToRename = @(
    @{Old = "web/src/components/ui/Badge.tsx"; New = "web/src/components/ui/badge.tsx"},
    @{Old = "web/src/components/ui/Button.tsx"; New = "web/src/components/ui/button.tsx"},
    @{Old = "web/src/components/ui/Card.tsx"; New = "web/src/components/ui/card.tsx"},
    @{Old = "web/src/components/ui/Form.tsx"; New = "web/src/components/ui/form.tsx"},
    @{Old = "web/src/components/ui/Input.tsx"; New = "web/src/components/ui/input.tsx"},
    @{Old = "web/src/components/ui/Label.tsx"; New = "web/src/components/ui/label.tsx"},
    @{Old = "web/src/components/ui/Table.tsx"; New = "web/src/components/ui/table.tsx"},
    @{Old = "web/src/components/ui/Textarea.tsx"; New = "web/src/components/ui/textarea.tsx"}
)

Write-Host "Starting file casing fix..." -ForegroundColor Green
Write-Host ""

# Configure Git to be case-sensitive
Write-Host "Configuring Git to be case-sensitive..." -ForegroundColor Yellow
git config core.ignorecase false

foreach ($file in $filesToRename) {
    $oldPath = $file.Old
    $newPath = $file.New
    $tempPath = $newPath + ".tmp"
    
    Write-Host "Processing: $oldPath -> $newPath" -ForegroundColor Cyan
    
    # Check if the old file exists
    if (Test-Path $oldPath) {
        try {
            # Step 1: Rename to temporary name
            Write-Host "  Step 1: Renaming to temporary file..." -ForegroundColor Gray
            git mv $oldPath $tempPath
            
            if ($LASTEXITCODE -eq 0) {
                # Step 2: Rename to final lowercase name
                Write-Host "  Step 2: Renaming to final name..." -ForegroundColor Gray
                git mv $tempPath $newPath
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✓ Successfully renamed" -ForegroundColor Green
                } else {
                    Write-Host "  ✗ Failed to rename to final name" -ForegroundColor Red
                    # Try to revert
                    git mv $tempPath $oldPath 2>$null
                }
            } else {
                Write-Host "  ✗ Failed to rename to temporary name" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "  ✗ Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ℹ File not found (may already be lowercase)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "Checking Git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "File casing fix completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the changes with: git status" -ForegroundColor White
Write-Host "2. If everything looks good, commit the changes: git commit -m 'fix: normalize component file names to lowercase'" -ForegroundColor White
Write-Host "3. Rebuild the project: cd web && npm run build" -ForegroundColor White

