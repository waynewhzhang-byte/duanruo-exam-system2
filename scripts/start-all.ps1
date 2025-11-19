# Start backend and frontend services

Write-Host "Starting backend service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; mvn spring-boot:run -pl exam-bootstrap"

Write-Host "Waiting 5 seconds before starting frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting frontend service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\web' ; npm run dev"

Write-Host ""
Write-Host "Services are starting..." -ForegroundColor Cyan
Write-Host "Backend will be available at: http://localhost:8081" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please wait about 60 seconds for both services to fully start." -ForegroundColor Yellow

