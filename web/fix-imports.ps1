# Fix component imports to use lowercase file names
# This script fixes the casing issue with UI component imports

$components = @("Badge", "Button", "Card", "Form", "Input", "Label", "Table", "Textarea")

Write-Host "Fixing component imports to use lowercase..."

foreach ($component in $components) {
    $upperPath = "@/components/ui/$component"
    $lowerPath = "@/components/ui/$($component.ToLower())"
    
    Write-Host "Replacing $upperPath with $lowerPath"
    
    # Find all .tsx and .ts files
    Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" -File | ForEach-Object {
        $file = $_
        $content = Get-Content $file.FullName -Raw
        
        if ($content -match [regex]::Escape($upperPath)) {
            Write-Host "  Updating $($file.FullName)"
            $newContent = $content -replace [regex]::Escape($upperPath), $lowerPath
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
        }
    }
}

Write-Host "Done!"

