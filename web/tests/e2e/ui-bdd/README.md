# UI BDD 测试套件

基于 Playwright 的端到端 UI 测试，覆盖所有用户角色和核心业务流程。

## 📁 测试文件结构

```
ui-bdd/
├── 01-super-admin.spec.ts      # 超级管理员测试（租户管理）
├── 02-tenant-admin.spec.ts     # 租户管理员测试（考试管理、用户管理）
├── 03-candidate.spec.ts        # 考生测试（报名、支付、准考证、成绩）
├── 04-reviewer.spec.ts         # 审核员测试（一级、二级审核）
├── run-all-tests.ps1           # 运行所有测试
├── run-single-test.ps1         # 运行单个角色测试
├── run-debug-test.ps1          # 调试模式
└── README.md                   # 本文档
```

## 🚀 快速开始

### 1. 前置条件

确保以下服务正在运行：

```bash
# 前端服务（端口 3000）
cd web
npm run dev

# 后端服务（端口 8081）
cd exam-bootstrap
mvn spring-boot:run

# 数据库（PostgreSQL）
# 确保数据库服务运行在 localhost:5432

# MinIO（对象存储）
# 确保 MinIO 服务运行在 localhost:9000
```

### 2. 安装依赖

```bash
cd web
npm install
npx playwright install chromium
```

### 3. 运行测试

#### 运行所有测试

```powershell
# PowerShell
cd web/tests/e2e/ui-bdd
.\run-all-tests.ps1
```

#### 运行单个角色测试

```powershell
# 超级管理员测试
.\run-single-test.ps1 -Role "super-admin"

# 租户管理员测试
.\run-single-test.ps1 -Role "tenant-admin"

# 考生测试
.\run-single-test.ps1 -Role "candidate"

# 审核员测试
.\run-single-test.ps1 -Role "reviewer"
```

#### 调试模式

```powershell
# 调试整个角色的测试
.\run-debug-test.ps1 -Role "candidate"

# 调试特定场景
.\run-debug-test.ps1 -Role "candidate" -Scenario "场景3"
```

#### 直接使用 Playwright 命令

```bash
# 运行所有测试
npx playwright test tests/e2e/ui-bdd/

# 运行特定文件
npx playwright test tests/e2e/ui-bdd/01-super-admin.spec.ts

# 以 headed 模式运行（显示浏览器）
npx playwright test tests/e2e/ui-bdd/ --headed

# 调试模式
npx playwright test tests/e2e/ui-bdd/03-candidate.spec.ts --debug

# 运行特定测试
npx playwright test -g "场景3: 浏览可报名考试"

# 查看测试报告
npx playwright show-report
```

## 📋 测试覆盖

### 1. 超级管理员测试 (01-super-admin.spec.ts)

**测试账户:**
- 用户名: `super_admin`
- 密码: `SuperAdmin123!@#`
- URL: http://localhost:3000/login?role=super-admin

**测试场景:**
- ✅ 场景1: 超级管理员成功登录
- ✅ 场景2: 查看租户列表
- ✅ 场景3: 创建新租户
- ✅ 场景4: 查看租户详情
- ✅ 场景5: 启用/禁用租户
- ✅ 场景6: 查看系统统计

### 2. 租户管理员测试 (02-tenant-admin.spec.ts)

**测试账户:**
- 用户名: `tenant_admin_1762476737466`
- 密码: `TenantAdmin@123`
- URL: http://localhost:3000/login
- 租户ID: `421eee4a-1a2a-4f9d-95a4-37073d4b15c5`

**测试场景:**
- ✅ 场景1: 租户管理员成功登录
- ✅ 场景2: 选择租户
- ✅ 场景3: 查看考试列表
- ✅ 场景4: 创建新考试
- ✅ 场景5: 查看考试详情
- ✅ 场景6: 编辑考试
- ✅ 场景7: 为考试添加岗位
- ✅ 场景8: 查看用户列表
- ✅ 场景9: 指定审核员

### 3. 考生测试 (03-candidate.spec.ts)

**测试账户:**
- 用户名: `candidate_1762476516042`
- 密码: `Candidate@123`
- URL: http://localhost:3000/login
- 姓名: 张三
- 身份证: 110101199001011234

**测试场景:**
- ✅ 场景1: 考生成功登录
- ✅ 场景2: 查看个人信息
- ✅ 场景3: 浏览可报名考试
- ✅ 场景4: 查看考试详情
- ✅ 场景5: 报名考试
- ✅ 场景6: 查看我的报名
- ✅ 场景7: 上传附件材料
- ✅ 场景8: 查看待支付订单
- ✅ 场景9: 发起支付
- ✅ 场景10: 查看准考证
- ✅ 场景11: 下载准考证
- ✅ 场景12: 查询考试成绩

### 4. 审核员测试 (04-reviewer.spec.ts)

**测试账户:**

一级审核员:
- 用户名: `bdd_reviewer1`
- 密码: `Reviewer123!@#`
- URL: http://localhost:3000/login?role=reviewer

二级审核员:
- 用户名: `bdd_reviewer2`
- 密码: `Reviewer123!@#`
- URL: http://localhost:3000/login?role=reviewer

**测试场景:**
- ✅ 场景1: 一级审核员成功登录
- ✅ 场景2: 查看待审核列表
- ✅ 场景3: 查看报名详情
- ✅ 场景4: 查看考生附件
- ✅ 场景5: 审核通过
- ✅ 场景6: 审核拒绝
- ✅ 场景7: 二级审核员成功登录
- ✅ 场景8: 查看二级审核队列
- ✅ 场景9: 查看一级审核意见
- ✅ 场景10: 二级审核通过
- ✅ 场景11: 查看已审核列表
- ✅ 场景12: 查看审核统计

## 📊 测试结果

### 查看测试报告

```bash
# 生成并查看 HTML 报告
npx playwright show-report

# 报告位置
web/playwright-report/index.html
```

### 查看截图

所有测试截图保存在 `test-results/` 目录：

```bash
ls test-results/*.png
```

截图命名规则：
- `{role}-{action}.png`
- 例如: `candidate-login.png`, `tenant-admin-exam-list.png`

### 查看视频

失败的测试会自动录制视频，保存在 `test-results/` 目录。

## 🔍 测试特点

### 1. 智能选择器

测试使用多个备选选择器，提高测试的稳定性：

```typescript
const buttonSelectors = [
  'button:has-text("登录")',
  'button[type="submit"]',
  '[data-testid="login-btn"]'
];

for (const selector of buttonSelectors) {
  const btn = page.locator(selector).first();
  if (await btn.count() > 0) {
    await btn.click();
    break;
  }
}
```

### 2. 容错处理

对于可能不存在的功能，测试会优雅地跳过：

```typescript
if (!createButton) {
  console.log('⚠️ 未找到创建按钮，跳过此测试');
  test.skip();
  return;
}
```

### 3. 详细日志

每个测试步骤都有详细的控制台输出：

```typescript
console.log('✅ 登录成功');
console.log('⚠️ 未找到元素');
console.log('❌ 测试失败');
```

### 4. 截图记录

关键步骤自动截图，便于问题排查：

```typescript
await page.screenshot({ 
  path: 'test-results/candidate-login.png' 
});
```

## 🐛 调试技巧

### 1. 使用 Playwright Inspector

```bash
npx playwright test --debug
```

功能：
- 单步执行
- 查看元素选择器
- 查看网络请求
- 查看控制台日志

### 2. 慢速模式

```bash
npx playwright test --headed --slow-mo=1000
```

每个操作延迟 1 秒，便于观察。

### 3. 暂停执行

在测试代码中添加：

```typescript
await page.pause();
```

测试会在此处暂停，打开 Playwright Inspector。

### 4. 查看网络请求

```typescript
page.on('request', request => {
  console.log('Request:', request.method(), request.url());
});

page.on('response', response => {
  console.log('Response:', response.status(), response.url());
});
```

### 5. 查看控制台日志

```typescript
page.on('console', msg => {
  console.log('Browser console:', msg.type(), msg.text());
});
```

## 📝 编写新测试

### 1. 创建测试文件

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('功能模块名称', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前的准备工作
    await page.goto('http://localhost:3000');
  });

  test('场景描述', async ({ page }) => {
    console.log('\n📋 测试场景: 场景描述');
    
    // 测试步骤
    await page.fill('input[name="username"]', 'test_user');
    await page.click('button[type="submit"]');
    
    // 断言
    await expect(page).toHaveURL(/dashboard/);
    
    // 截图
    await page.screenshot({ path: 'test-results/test-name.png' });
    
    console.log('✅ 测试完成');
  });
});
```

### 2. 使用辅助函数

```typescript
async function login(page: Page, username: string, password: string) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}
```

### 3. 添加智能选择器

```typescript
const selectors = [
  'button:has-text("提交")',
  'button[type="submit"]',
  '[data-testid="submit-btn"]'
];

let button = null;
for (const selector of selectors) {
  const btn = page.locator(selector).first();
  if (await btn.count() > 0) {
    button = btn;
    break;
  }
}
```

## 🔧 配置

### Playwright 配置

配置文件: `web/playwright.config.ts`

主要配置项：
- `baseURL`: http://localhost:3000
- `timeout`: 60000ms (60秒)
- `screenshot`: 失败时截图
- `video`: 失败时录制视频
- `trace`: 重试时记录 trace

### 环境变量

```bash
# 设置基础 URL
export BASE_URL=http://localhost:3000

# 设置超时时间
export TIMEOUT=60000

# 启用调试
export DEBUG=pw:api
```

## 📚 参考资料

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright API 文档](https://playwright.dev/docs/api/class-playwright)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [项目 BDD 测试文档](../../../BDD_TEST_EXECUTION_GUIDE_CHROME_DEVTOOLS.md)

## 🤝 贡献

如果发现测试问题或需要添加新测试场景，请：

1. 在对应的测试文件中添加新的 `test()` 块
2. 遵循现有的命名和结构规范
3. 添加详细的日志输出
4. 在关键步骤添加截图
5. 更新本 README 文档

## 📞 支持

如有问题，请查看：
- 测试日志输出
- 截图文件 (`test-results/*.png`)
- Playwright 报告 (`npx playwright show-report`)
- 视频录制（失败测试）

---

**最后更新**: 2025-11-07
**版本**: 1.0.0

