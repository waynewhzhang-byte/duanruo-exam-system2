# 删除所有.bak文件
Write-Host "删除所有.bak迁移文件..." -ForegroundColor Yellow

Get-ChildItem -Path "exam-infrastructure/src/main/resources/db/migration" -Filter "*.bak" | ForEach-Object {
    Write-Host "删除: $($_.FullName)" -ForegroundColor Red
    Remove-Item $_.FullName -Force
}

Write-Host "完成！" -ForegroundColor Green

