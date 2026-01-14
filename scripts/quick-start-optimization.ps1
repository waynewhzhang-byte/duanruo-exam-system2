# ============================================
# 快速开始优化脚本
# ============================================
# 用途: 一键检查系统状态并开始P0优化
# 运行: ./scripts/quick-start-optimization.ps1
# ============================================

param(
    [switch]$SkipChecks,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  架构优化快速启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 第1步: 环境检查
# ============================================
if (-not $SkipChecks) {
    Write-Host "[1/6] 检查环境..." -ForegroundColor Yellow

    # 检查Java
    try {
        $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
        Write-Host "  ✓ Java: $javaVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Java未安装或未配置PATH" -ForegroundColor Red
        exit 1
    }

    # 检查Maven
    try {
        $mvnVersion = mvn -version | Select-String "Apache Maven" | Select-Object -First 1
        Write-Host "  ✓ Maven: $mvnVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Maven未安装或未配置PATH" -ForegroundColor Red
        exit 1
    }

    # 检查Node.js
    try {
        $nodeVersion = node -v
        Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Node.js未安装或未配置PATH" -ForegroundColor Red
        exit 1
    }

    # 检查PostgreSQL
    try {
        $pgVersion = psql --version
        Write-Host "  ✓ PostgreSQL: $pgVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ PostgreSQL未安装或未配置PATH" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
}

# ============================================
# 第2步: 代码检查
# ============================================
Write-Host "[2/6] 检查代码状态..." -ForegroundColor Yellow

# 检查是否有未提交的更改
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  ⚠ 发现未提交的更改:" -ForegroundColor Yellow
    Write-Host $gitStatus
    $continue = Read-Host "  是否继续? (y/n)"
    if ($continue -ne "y") {
        Write-Host "  已取消" -ForegroundColor Red
        exit 0
    }
}

Write-Host "  ✓ Git状态检查完成" -ForegroundColor Green
Write-Host ""

# ============================================
# 第3步: 创建优化分支
# ============================================
Write-Host "[3/6] 创建优化分支..." -ForegroundColor Yellow

$branchName = "optimize/p0-critical-fixes-$(Get-Date -Format 'yyyyMMdd')"

if (-not $DryRun) {
    try {
        git checkout -b $branchName
        Write-Host "  ✓ 已创建分支: $branchName" -ForegroundColor Green
    } catch {
        Write-Host "  分支可能已存在，切换到该分支..." -ForegroundColor Yellow
        git checkout $branchName
    }
} else {
    Write-Host "  [DRY RUN] 将创建分支: $branchName" -ForegroundColor Cyan
}

Write-Host ""

# ============================================
# 第4步: 后端快速修复
# ============================================
Write-Host "[4/6] 后端快速修复..." -ForegroundColor Yellow

Write-Host "  → 任务1: 修复ThreadLocal泄漏" -ForegroundColor Cyan
Write-Host "     文件: exam-infrastructure/.../TenantContextFilter.java"
Write-Host "     操作: 添加finally块确保清理"
Write-Host ""

Write-Host "  → 任务2: 添加数据库索引" -ForegroundColor Cyan
Write-Host "     文件: V021__add_performance_indexes.sql"
Write-Host "     操作: 创建索引migration"
Write-Host ""

$createIndexes = Read-Host "是否立即创建索引migration文件? (y/n)"
if ($createIndexes -eq "y" -and -not $DryRun) {
    $migrationDir = "exam-infrastructure/src/main/resources/db/tenant-migration"
    $migrationFile = "$migrationDir/V021__add_performance_indexes.sql"

    if (Test-Path $migrationFile) {
        Write-Host "  ⚠ 文件已存在: $migrationFile" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ 请手动创建文件并添加索引SQL" -ForegroundColor Green
        Write-Host "     参考: OPTIMIZATION-IMPLEMENTATION-GUIDE.md"
    }
}

Write-Host ""

# ============================================
# 第5步: 前端快速修复
# ============================================
Write-Host "[5/6] 前端快速修复..." -ForegroundColor Yellow

Write-Host "  → 任务1: 修复硬编码URL (15分钟)" -ForegroundColor Cyan
$createEnv = Read-Host "是否创建.env.local文件? (y/n)"
if ($createEnv -eq "y" -and -not $DryRun) {
    $envContent = @"
# 开发环境配置
NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1
NEXT_PUBLIC_APP_ENV=development
"@
    Set-Content -Path "web/.env.local" -Value $envContent
    Write-Host "  ✓ 已创建 web/.env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "  → 任务2: Schema Memoization (30分钟)" -ForegroundColor Cyan
Write-Host "     文件: web/src/components/forms/DynamicForm.tsx"
Write-Host "     操作: 添加 useMemo"
Write-Host ""

Write-Host "  → 任务3: 删除废弃文件 (10分钟)" -ForegroundColor Cyan
$deleteOld = Read-Host "是否删除所有*_old.tsx文件? (y/n)"
if ($deleteOld -eq "y" -and -not $DryRun) {
    Push-Location web
    $oldFiles = Get-ChildItem -Path "src/app" -Filter "*_old.tsx" -Recurse
    if ($oldFiles.Count -gt 0) {
        Write-Host "  发现 $($oldFiles.Count) 个废弃文件:" -ForegroundColor Yellow
        $oldFiles | ForEach-Object { Write-Host "    - $($_.FullName)" }

        $confirmDelete = Read-Host "  确认删除? (y/n)"
        if ($confirmDelete -eq "y") {
            $oldFiles | Remove-Item -Force
            Write-Host "  ✓ 已删除 $($oldFiles.Count) 个文件" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✓ 未发现废弃文件" -ForegroundColor Green
    }
    Pop-Location
}

Write-Host ""

# ============================================
# 第6步: 生成任务清单
# ============================================
Write-Host "[6/6] 生成任务清单..." -ForegroundColor Yellow

$tasksContent = @"
# P0优化任务清单
生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
分支: $branchName

## 后端任务 (5天)

### 1. ThreadLocal泄漏修复 (1天) ⚠️ 严重
- [ ] 修改 TenantContextFilter.java (添加finally块)
- [ ] 修改 TenantContext.java (添加验证方法)
- [ ] 创建单元测试 TenantContextTest.java
- [ ] 运行测试验证
- [ ] 提交代码

### 2. 支付幂等性 (2天) ⚠️ 严重
- [ ] 创建 V023__create_idempotency_records.sql
- [ ] 创建 IdempotencyRecordEntity.java
- [ ] 创建 JpaIdempotencyRecordRepository.java
- [ ] 修改 PaymentApplicationService.java
- [ ] 创建清理定时任务
- [ ] 测试重复回调
- [ ] 提交代码

### 3. SSO重构清理 (3天)
- [ ] 检查所有@Deprecated使用
- [ ] 替换为新的UserTenantRole方式
- [ ] 删除User.java中的@Deprecated字段和方法
- [ ] 更新相关测试
- [ ] 验证编译无错误
- [ ] 提交代码

### 4. 数据库索引 (1天)
- [ ] 创建 V021__add_performance_indexes.sql
- [ ] 运行 mvn flyway:migrate
- [ ] 验证索引已创建
- [ ] 测试查询性能
- [ ] 提交代码

### 5. 分布式锁 (2天)
- [ ] 添加Redisson依赖
- [ ] 配置RedissonClient
- [ ] 修改ReviewApplicationService (添加锁)
- [ ] 测试并发场景
- [ ] 提交代码

## 前端任务 (1天)

### 1. 硬编码URL修复 (15分钟)
- [x] 创建 .env.local
- [ ] 更新 lib/api.ts (添加API_BASE)
- [ ] 修改 login/page.tsx (使用API_BASE)
- [ ] 验证构建成功
- [ ] 提交代码

### 2. Schema Memoization (30分钟)
- [ ] 修改 DynamicForm.tsx (添加useMemo)
- [ ] 测试表单性能
- [ ] 提交代码

### 3. Token管理统一 (2小时)
- [ ] 创建 TokenManager.ts
- [ ] 更新 AuthContext.tsx
- [ ] 更新 api.ts
- [ ] 清理旧的token访问代码
- [ ] 测试登录/登出
- [ ] 提交代码

### 4. Token自动刷新 (3小时)
- [ ] 创建 AuthService.ts
- [ ] 更新 api.ts (401自动重试)
- [ ] 更新 AuthContext.tsx (启动自动刷新)
- [ ] 后端添加 /auth/refresh 接口
- [ ] 测试自动刷新
- [ ] 提交代码

### 5. 删除废弃文件 (10分钟)
- [x] 删除所有*_old.tsx文件
- [ ] 提交代码

## 验证清单

### 后端验证
- [ ] mvn clean compile (无错误)
- [ ] mvn test (所有测试通过)
- [ ] 启动应用成功
- [ ] 支付回调测试通过
- [ ] 审核并发测试通过

### 前端验证
- [ ] npm run build (无错误)
- [ ] npm run type-check (无类型错误)
- [ ] npm run lint (无lint错误)
- [ ] 登录功能正常
- [ ] 表单性能提升
- [ ] Token自动刷新工作

## 下一步
- 完成P0后，进入P1优化阶段
- 参考: OPTIMIZATION-IMPLEMENTATION-GUIDE.md
"@

if (-not $DryRun) {
    Set-Content -Path "P0-TASKS.md" -Value $tasksContent
    Write-Host "  ✓ 已创建任务清单: P0-TASKS.md" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] 将创建任务清单: P0-TASKS.md" -ForegroundColor Cyan
}

Write-Host ""

# ============================================
# 完成
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  快速启动完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "  1. 查看任务清单: P0-TASKS.md"
Write-Host "  2. 查看详细指南: OPTIMIZATION-IMPLEMENTATION-GUIDE.md"
Write-Host "  3. 前端快速修复: web/FRONTEND-QUICK-FIXES.md"
Write-Host "  4. 开始第一个任务: 修复ThreadLocal泄漏"
Write-Host ""
Write-Host "预计完成时间:" -ForegroundColor Yellow
Write-Host "  - P0优化 (1人): 9个工作日"
Write-Host "  - P0优化 (2人并行): 5个工作日"
Write-Host ""
Write-Host "如有问题，请参考架构分析报告:" -ForegroundColor Yellow
Write-Host "  - ARCHITECTURE-ANALYSIS-REPORT.md"
Write-Host "  - FRONTEND-ANALYSIS-SUPPLEMENT.md"
Write-Host ""
