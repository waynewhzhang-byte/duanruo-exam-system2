# UI测试数据准备脚本
# 在运行UI测试前，先创建必要的测试数据

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "准备UI测试数据" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8081/api/v1"
$tenantId = "421eee4a-1a2a-4f9d-95a4-37073d4b15c5"
$tenantAdminUsername = "tenant_admin_1762476737466"
$tenantAdminPassword = "TenantAdmin@123"
$candidateUsername = "candidate_1762476516042"
$candidatePassword = "Candidate@123"

# 1. 租户管理员登录
Write-Host "[步骤1] 租户管理员登录..." -ForegroundColor Yellow
$loginData = @{
    username = $tenantAdminUsername
    password = $tenantAdminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✅ 租户管理员登录成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 租户管理员登录失败" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "X-Tenant-Id" = $tenantId
    "Content-Type" = "application/json"
}

# 2. 创建考试
Write-Host "[步骤2] 创建考试..." -ForegroundColor Yellow
$examData = @{
    title = "2024年度公务员招聘考试"
    code = "EXAM2024-001"
    description = "面向社会公开招聘公务员"
    registrationStart = "2024-01-01 00:00:00"
    registrationEnd = "2024-12-31 23:59:59"
    examStart = "2025-01-15 09:00:00"
    examEnd = "2025-01-15 11:30:00"
    feeRequired = $true
    feeAmount = 100.00
    announcement = "请考生按时参加考试"
} | ConvertTo-Json

try {
    $examResponse = Invoke-RestMethod -Uri "$baseUrl/exams" -Method POST -Headers $headers -Body $examData
    $examId = $examResponse.data.id
    Write-Host "✅ 考试创建成功: $examId" -ForegroundColor Green
} catch {
    Write-Host "❌ 考试创建失败: $_" -ForegroundColor Red
    exit 1
}

# 3. 创建岗位
Write-Host "[步骤3] 创建岗位..." -ForegroundColor Yellow
$positionData = @{
    name = "行政管理岗"
    code = "POS001"
    description = "负责行政管理工作"
    requirements = "本科及以上学历，行政管理相关专业"
    maxApplicants = 100
} | ConvertTo-Json

try {
    $positionResponse = Invoke-RestMethod -Uri "$baseUrl/exams/$examId/positions" -Method POST -Headers $headers -Body $positionData
    $positionId = $positionResponse.data.id
    Write-Host "✅ 岗位创建成功: $positionId" -ForegroundColor Green
} catch {
    Write-Host "❌ 岗位创建失败: $_" -ForegroundColor Red
    exit 1
}

# 4. 创建科目
Write-Host "[步骤4] 创建科目..." -ForegroundColor Yellow
$subjectData = @{
    name = "行政职业能力测验"
    code = "SUB001"
    totalScore = 100
    description = "测试行政职业能力"
} | ConvertTo-Json

try {
    $subjectResponse = Invoke-RestMethod -Uri "$baseUrl/positions/$positionId/subjects" -Method POST -Headers $headers -Body $subjectData
    $subjectId = $subjectResponse.data.id
    Write-Host "✅ 科目创建成功: $subjectId" -ForegroundColor Green
} catch {
    Write-Host "❌ 科目创建失败: $_" -ForegroundColor Red
    exit 1
}

# 5. 考生登录
Write-Host "[步骤5] 考生登录..." -ForegroundColor Yellow
$candidateLoginData = @{
    username = $candidateUsername
    password = $candidatePassword
} | ConvertTo-Json

try {
    $candidateLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $candidateLoginData -ContentType "application/json"
    $candidateToken = $candidateLoginResponse.data.token
    Write-Host "✅ 考生登录成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 考生登录失败" -ForegroundColor Red
    exit 1
}

$candidateHeaders = @{
    "Authorization" = "Bearer $candidateToken"
    "X-Tenant-Id" = $tenantId
    "Content-Type" = "application/json"
}

# 6. 考生报名
Write-Host "[步骤6] 考生报名..." -ForegroundColor Yellow
$applicationData = @{
    examId = $examId
    positionId = $positionId
    formData = @{
        name = "张三"
        idCard = "110101199001011234"
        phone = "13800138000"
        email = "zhangsan@example.com"
    }
} | ConvertTo-Json -Depth 3

try {
    $applicationResponse = Invoke-RestMethod -Uri "$baseUrl/applications" -Method POST -Headers $candidateHeaders -Body $applicationData
    $applicationId = $applicationResponse.data.id
    Write-Host "✅ 考生报名成功: $applicationId" -ForegroundColor Green
} catch {
    Write-Host "⚠️  考生报名失败（可能已报名）: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 测试数据准备完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "测试数据:" -ForegroundColor Cyan
Write-Host "  - 考试ID: $examId" -ForegroundColor White
Write-Host "  - 岗位ID: $positionId" -ForegroundColor White
Write-Host "  - 科目ID: $subjectId" -ForegroundColor White
Write-Host ""
Write-Host "现在可以运行UI测试: .\run-ui-bdd-test.ps1" -ForegroundColor Cyan

