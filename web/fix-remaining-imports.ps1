# Fix all remaining uppercase imports in the codebase
$ErrorActionPreference = "Continue"

Write-Host "Searching for files with uppercase UI component imports..." -ForegroundColor Yellow

$count = 0

Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" -File | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if ($content) {
        $modified = $false
        $originalContent = $content
        
        # Replace all possible uppercase imports
        $content = $content -creplace '@/components/ui/Badge([''"])', '@/components/ui/badge$1'
        $content = $content -creplace '@/components/ui/Button([''"])', '@/components/ui/button$1'
        $content = $content -creplace '@/components/ui/Card([''"])', '@/components/ui/card$1'
        $content = $content -creplace '@/components/ui/Form([''"])', '@/components/ui/form$1'
        $content = $content -creplace '@/components/ui/Input([''"])', '@/components/ui/input$1'
        $content = $content -creplace '@/components/ui/Label([''"])', '@/components/ui/label$1'
        $content = $content -creplace '@/components/ui/Table([''"])', '@/components/ui/table$1'
        $content = $content -creplace '@/components/ui/Textarea([''"])', '@/components/ui/textarea$1'
        $content = $content -creplace '@/components/ui/Loading([''"])', '@/components/ui/loading$1'
        $content = $content -creplace '@/components/ui/FileUpload([''"])', '@/components/ui/fileupload$1'
        $content = $content -creplace '@/components/ui/FormFileUpload([''"])', '@/components/ui/formfileupload$1'
        $content = $content -creplace '@/components/ui/QRCodeDisplay([''"])', '@/components/ui/qrcodedisplay$1'
        
        if ($content -ne $originalContent) {
            Write-Host "Fixing: $($file.FullName)" -ForegroundColor Cyan
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
            $count++
        }
    }
}

Write-Host ""
Write-Host "Fixed $count files" -ForegroundColor Green

