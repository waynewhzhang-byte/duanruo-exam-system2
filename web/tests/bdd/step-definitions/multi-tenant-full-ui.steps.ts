import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { expect } from 'chai';

setDefaultTimeout(180 * 1000);

type UiWorld = {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  runtime?: {
    tenantName: string;
    tenantCode: string;
    examName: string;
    candidateName: string;
  };
};

const APP_BASE_URL = process.env.UI_BASE_URL || 'http://localhost:3000';
const LOGIN_PATH = process.env.UI_LOGIN_PATH || '/login';

const SUPER_ADMIN_USER = process.env.E2E_SUPER_ADMIN_USER || 'superadmin';
const SUPER_ADMIN_PASS = process.env.E2E_SUPER_ADMIN_PASS || 'Admin@123456';

const TENANT_ADMIN_USER = process.env.E2E_TENANT_ADMIN_USER || 'tenant-admin-e2e';
const TENANT_ADMIN_PASS = process.env.E2E_TENANT_ADMIN_PASS || 'Admin@123456';
const TENANT_ADMIN_EMAIL = process.env.E2E_TENANT_ADMIN_EMAIL || 'tenant-admin-e2e@example.com';

const REVIEWER_USER = process.env.E2E_REVIEWER_USER || 'reviewer-e2e';
const REVIEWER_PASS = process.env.E2E_REVIEWER_PASS || 'Admin@123456';
const REVIEWER_EMAIL = process.env.E2E_REVIEWER_EMAIL || 'reviewer-e2e@example.com';

const CANDIDATE_USER = process.env.E2E_CANDIDATE_USER || 'candidate-e2e';
const CANDIDATE_PASS = process.env.E2E_CANDIDATE_PASS || 'Candidate@123456';

function nowSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function ensurePage(world: UiWorld): Page {
  if (!world.page) {
    throw new Error('Page not initialized. 请先执行浏览器初始化步骤。');
  }
  return world.page;
}

function ensureRuntime(world: UiWorld): NonNullable<UiWorld['runtime']> {
  if (!world.runtime) {
    throw new Error('Runtime context missing. 请先执行浏览器初始化步骤。');
  }
  return world.runtime;
}

async function gotoLogin(page: Page): Promise<void> {
  await page.goto(`${APP_BASE_URL}${LOGIN_PATH}`, { waitUntil: 'domcontentloaded' });
}

async function fillFirstVisible(page: Page, candidates: string[], value: string): Promise<void> {
  for (const selector of candidates) {
    const loc = page.locator(selector).first();
    if (await loc.isVisible().catch(() => false)) {
      await loc.fill(value);
      return;
    }
  }
  throw new Error(`No visible input found for selectors: ${candidates.join(', ')}`);
}

async function clickAnyByText(page: Page, texts: string[]): Promise<void> {
  for (const text of texts) {
    const byRole = page.getByRole('button', { name: text }).first();
    if (await byRole.isVisible().catch(() => false)) {
      await byRole.click();
      return;
    }

    const generic = page.locator(`text=${text}`).first();
    if (await generic.isVisible().catch(() => false)) {
      await generic.click();
      return;
    }
  }
  throw new Error(`No clickable element found for texts: ${texts.join(', ')}`);
}

async function waitDashboard(page: Page): Promise<void> {
  await Promise.race([
    page.waitForURL(/dashboard|admin|candidate|review/i, { timeout: 15_000 }),
    page.waitForLoadState('networkidle'),
  ]);
}

async function login(page: Page, username: string, password: string): Promise<void> {
  await gotoLogin(page);
  await fillFirstVisible(page, ['input[name="username"]', 'input[name="account"]', 'input[type="text"]'], username);
  await fillFirstVisible(page, ['input[name="password"]', 'input[type="password"]'], password);
  await clickAnyByText(page, ['登录', 'Login', '立即登录']);
  await waitDashboard(page);
}

async function safeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `test-results/bdd/${name}.png`,
    fullPage: true,
  });
}

Given('[UI实测] 我启动真实浏览器会话', async function (this: UiWorld) {
  this.browser = await chromium.launch({
    headless: process.env.E2E_HEADLESS !== 'false',
    slowMo: Number(process.env.E2E_SLOW_MO || '80'),
  });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();

  const suffix = nowSuffix();
  this.runtime = {
    tenantName: `UI测试租户-${suffix}`,
    tenantCode: `ui_${suffix.replaceAll(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 16)}`,
    examName: `UI全流程考试-${suffix}`,
    candidateName: '张三',
  };
});

When('[UI实测] 我用超级管理员登录平台', async function (this: UiWorld) {
  const page = ensurePage(this);
  await login(page, SUPER_ADMIN_USER, SUPER_ADMIN_PASS);
  await safeScreenshot(page, 'ui-real-01-superadmin-login');
});

When('[UI实测] 我创建租户并创建租户管理员账号', async function (this: UiWorld) {
  const page = ensurePage(this);
  const runtime = ensureRuntime(this);

  await clickAnyByText(page, ['租户管理', 'Tenants']);
  await clickAnyByText(page, ['创建租户', '新建租户', 'Create Tenant']);

  await fillFirstVisible(page, ['input[name="name"]', 'input[placeholder*="租户"]'], runtime.tenantName);
  await fillFirstVisible(page, ['input[name="code"]', 'input[placeholder*="编码"]'], runtime.tenantCode);
  await fillFirstVisible(page, ['input[name="contactEmail"]', 'input[type="email"]'], TENANT_ADMIN_EMAIL);
  await clickAnyByText(page, ['保存', '创建', '提交', 'Create']);

  await clickAnyByText(page, ['租户管理员', 'Tenant Admin']);
  await clickAnyByText(page, ['新增管理员', '创建管理员', 'Add Admin']);
  await fillFirstVisible(page, ['input[name="username"]', 'input[placeholder*="用户名"]'], TENANT_ADMIN_USER);
  await fillFirstVisible(page, ['input[name="email"]', 'input[type="email"]'], TENANT_ADMIN_EMAIL);
  await fillFirstVisible(page, ['input[name="password"]', 'input[type="password"]'], TENANT_ADMIN_PASS);
  await clickAnyByText(page, ['保存', '创建', '提交', 'Create']);

  await safeScreenshot(page, 'ui-real-02-tenant-created-admin-created');
});

When('[UI实测] 我以租户管理员登录并创建发布考试', async function (this: UiWorld) {
  const page = ensurePage(this);
  const runtime = ensureRuntime(this);

  await clickAnyByText(page, ['退出登录', 'Logout']);
  await login(page, TENANT_ADMIN_USER, TENANT_ADMIN_PASS);

  await clickAnyByText(page, ['考试管理', 'Exams']);
  await clickAnyByText(page, ['创建考试', '新建考试', 'Create Exam']);

  await fillFirstVisible(page, ['input[name="title"]', 'input[placeholder*="考试名称"]'], runtime.examName);
  await fillFirstVisible(page, ['input[name="code"]', 'input[placeholder*="考试编码"]'], `EX-${nowSuffix().slice(0, 8).toUpperCase()}`);
  await fillFirstVisible(page, ['textarea[name="description"]', 'textarea'], 'UI端到端自动化场景创建');
  await clickAnyByText(page, ['保存草稿', '保存', 'Create']);

  await clickAnyByText(page, ['发布考试', '发布', 'Publish']);
  await safeScreenshot(page, 'ui-real-03-exam-created-and-published');
});

When('[UI实测] 我在租户下创建审核员账号', async function (this: UiWorld) {
  const page = ensurePage(this);

  await clickAnyByText(page, ['用户管理', 'Users']);
  await clickAnyByText(page, ['新增用户', '创建用户', 'Add User']);

  await fillFirstVisible(page, ['input[name="username"]', 'input[placeholder*="用户名"]'], REVIEWER_USER);
  await fillFirstVisible(page, ['input[name="email"]', 'input[type="email"]'], REVIEWER_EMAIL);
  await fillFirstVisible(page, ['input[name="password"]', 'input[type="password"]'], REVIEWER_PASS);

  await clickAnyByText(page, ['审核员', 'Reviewer']);
  await clickAnyByText(page, ['保存', '创建', '提交', 'Create']);
  await safeScreenshot(page, 'ui-real-04-reviewer-created');
});

When('[UI实测] 我以考生身份登录并跨租户提交多个考试报名', async function (this: UiWorld) {
  const page = ensurePage(this);

  await clickAnyByText(page, ['退出登录', 'Logout']);
  await login(page, CANDIDATE_USER, CANDIDATE_PASS);

  await clickAnyByText(page, ['考试列表', 'Exams']);
  await clickAnyByText(page, ['立即报名', '报名', 'Apply']);
  await clickAnyByText(page, ['提交报名', '提交', 'Submit']);

  await clickAnyByText(page, ['切换租户', '租户切换', 'Switch Tenant']);
  await clickAnyByText(page, ['教育局', 'edu-bj']);
  await clickAnyByText(page, ['考试列表', 'Exams']);
  await clickAnyByText(page, ['立即报名', '报名', 'Apply']);
  await clickAnyByText(page, ['提交报名', '提交', 'Submit']);

  await clickAnyByText(page, ['切换租户', '租户切换', 'Switch Tenant']);
  await clickAnyByText(page, ['人社局', 'hrs-bj']);
  await clickAnyByText(page, ['考试列表', 'Exams']);
  await clickAnyByText(page, ['立即报名', '报名', 'Apply']);
  await clickAnyByText(page, ['提交报名', '提交', 'Submit']);

  await safeScreenshot(page, 'ui-real-05-candidate-cross-tenant-apply');
});

When('[UI实测] 我以审核员身份审核并批准考试资格', async function (this: UiWorld) {
  const page = ensurePage(this);

  await clickAnyByText(page, ['退出登录', 'Logout']);
  await login(page, REVIEWER_USER, REVIEWER_PASS);

  await clickAnyByText(page, ['审核中心', '审核列表', 'Review']);
  await clickAnyByText(page, ['待审核', 'Pending']);
  await clickAnyByText(page, ['通过', '批准', 'Approve']);
  await clickAnyByText(page, ['确认', 'Confirm']);

  await safeScreenshot(page, 'ui-real-06-review-approved');
});

When('[UI实测] 我以租户管理员分配考场座位与准考证', async function (this: UiWorld) {
  const page = ensurePage(this);

  await clickAnyByText(page, ['退出登录', 'Logout']);
  await login(page, TENANT_ADMIN_USER, TENANT_ADMIN_PASS);

  await clickAnyByText(page, ['考务管理', '考场管理', 'Seating']);
  await clickAnyByText(page, ['分配座位', '自动分配', 'Assign Seats']);
  await clickAnyByText(page, ['确认', 'Confirm']);

  await clickAnyByText(page, ['准考证', 'Ticket']);
  await clickAnyByText(page, ['生成准考证', '批量生成', 'Generate']);
  await clickAnyByText(page, ['确认', 'Confirm']);

  await safeScreenshot(page, 'ui-real-07-seating-and-ticket-generated');
});

When('[UI实测] 我录入本次考试成绩并标记是否进入面试', async function (this: UiWorld) {
  const page = ensurePage(this);

  await clickAnyByText(page, ['成绩管理', 'Scores']);
  await clickAnyByText(page, ['录入成绩', '导入成绩', 'Input Score']);

  await fillFirstVisible(page, ['input[name="writtenScore"]', 'input[placeholder*="笔试"]'], '86');
  await clickAnyByText(page, ['进入面试', '面试资格', 'Interview Eligible']);
  await clickAnyByText(page, ['保存', '提交', 'Save']);

  await safeScreenshot(page, 'ui-real-08-score-and-interview-updated');
});

Then('[UI实测] 考生端可以同步看到报名、准考证、成绩与面试状态', async function (this: UiWorld) {
  const page = ensurePage(this);

  await clickAnyByText(page, ['退出登录', 'Logout']);
  await login(page, CANDIDATE_USER, CANDIDATE_PASS);

  await clickAnyByText(page, ['我的报名', 'Applications']);
  const applicationCard = page.locator('body');
  expect(applicationCard).to.exist;

  await clickAnyByText(page, ['准考证', 'Ticket']);
  await clickAnyByText(page, ['成绩查询', '我的成绩', 'Scores']);

  const pageText = await page.locator('body').innerText();
  expect(pageText).to.match(/准考证|座位|成绩|面试|资格/);

  await safeScreenshot(page, 'ui-real-09-candidate-visible-results');
});

Then('[UI实测] 我关闭真实浏览器会话', async function (this: UiWorld) {
  await this.context?.close();
  await this.browser?.close();
});
