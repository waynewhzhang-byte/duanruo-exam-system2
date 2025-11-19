# 集成测试环境设置和测试执行脚本
# 用于Windows PowerShell环境

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "集成测试环境设置和测试执行" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查PostgreSQL是否运行
Write-Host "[1/4] 检查PostgreSQL服务..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "✓ PostgreSQL服务正在运行" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL服务未运行，请先启动PostgreSQL" -ForegroundColor Red
    exit 1
}

# 2. 创建测试数据库
Write-Host ""
Write-Host "[2/4] 创建测试数据库..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "create-test-database.sql"

# 使用psql执行SQL脚本
$env:PGPASSWORD = "postgres"
$createDbResult = & psql -U postgres -h localhost -p 5432 -f $scriptPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 测试数据库创建成功" -ForegroundColor Green
    Write-Host "  数据库名: exam_test" -ForegroundColor Gray
    Write-Host "  用户名: postgres" -ForegroundColor Gray
} else {
    Write-Host "✗ 测试数据库创建失败" -ForegroundColor Red
    Write-Host $createDbResult -ForegroundColor Red
    exit 1
}

# 3. 编译测试代码
Write-Host ""
Write-Host "[3/4] 编译测试代码..." -ForegroundColor Yellow
Set-Location -Path (Join-Path $PSScriptRoot "..\..\..\..\..\..")

$compileResult = & mvn clean compile test-compile -pl exam-bootstrap -DskipTests -q 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 测试代码编译成功" -ForegroundColor Green
} else {
    Write-Host "✗ 测试代码编译失败" -ForegroundColor Red
    Write-Host $compileResult -ForegroundColor Red
    exit 1
}

# 4. 运行集成测试
Write-Host ""
Write-Host "[4/4] 运行集成测试..." -ForegroundColor Yellow
Write-Host "测试类: ExamManagementIntegrationTest" -ForegroundColor Gray
Write-Host ""

$testResult = & mvn test -Dtest=ExamManagementIntegrationTest -pl exam-bootstrap 2>&1

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 所有测试通过！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ 测试失败，请查看上面的错误信息" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "测试报告位置:" -ForegroundColor Cyan
Write-Host "  exam-bootstrap/target/surefire-reports/" -ForegroundColor Gray
Write-Host ""

