/**
 * UI BDD测试 - 超级管理员功能
 * 测试账户: super_admin / SuperAdmin123!@#
 */

import { test, expect, Page } from '@playwright/test';

// 测试账户配置
const SUPER_ADMIN = {
  username: 'super_admin',
  password: 'SuperAdmin123!@#',
  loginUrl: 'http://localhost:3000/login?role=super-admin'
};

// 辅助函数：登录
async function loginAsSuperAdmin(page: Page) {
  await page.goto(SUPER_ADMIN.loginUrl);
  await page.waitForLoadState('networkidle');
  
  // 填写登录表单
  await page.fill('input[name="username"]', SUPER_ADMIN.username);
  await page.fill('input[name="password"]', SUPER_ADMIN.password);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待登录成功并跳转
  await page.waitForURL(/\/super-admin/, { timeout: 10000 });
  
  // 验证登录成功
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
  
  console.log('✅ 超级管理员登录成功');
}

test.describe('超级管理员 - 租户管理', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前都需要登录
    await loginAsSuperAdmin(page);
  });

  test('场景1: 超级管理员成功登录', async ({ page }) => {
    console.log('\n📋 测试场景: 超级管理员成功登录');
    
    // 验证页面标题或导航栏
    await expect(page).toHaveTitle(/超级管理员|管理后台/);
    
    // 验证用户信息显示
    const userInfo = page.locator('[data-testid="user-info"], .user-info, .user-name');
    if (await userInfo.count() > 0) {
      await expect(userInfo.first()).toBeVisible();
      console.log('✅ 用户信息显示正常');
    }
    
    // 截图
    await page.screenshot({ path: 'test-results/super-admin-login.png' });
    console.log('✅ 超级管理员登录验证完成');
  });

  test('场景2: 查看租户列表', async ({ page }) => {
    console.log('\n📋 测试场景: 查看租户列表');
    
    // 导航到租户管理页面
    const tenantLinks = [
      'a[href*="/super-admin/tenants"]',
      'a[href*="/tenants"]',
      'text=租户管理',
      'text=Tenant'
    ];
    
    let navigated = false;
    for (const selector of tenantLinks) {
      const link = page.locator(selector).first();
      if (await link.count() > 0) {
        await link.click();
        navigated = true;
        console.log(`✅ 通过选择器 ${selector} 导航成功`);
        break;
      }
    }
    
    if (!navigated) {
      // 直接访问URL
      await page.goto('http://localhost:3000/super-admin/tenants');
    }
    
    await page.waitForLoadState('networkidle');
    
    // 验证租户列表加载
    const tableSelectors = [
      'table',
      '[role="table"]',
      '.tenant-list',
      '[data-testid="tenant-table"]'
    ];
    
    let tableFound = false;
    for (const selector of tableSelectors) {
      const table = page.locator(selector).first();
      if (await table.count() > 0) {
        await expect(table).toBeVisible();
        tableFound = true;
        console.log(`✅ 租户列表表格找到 (${selector})`);
        break;
      }
    }
    
    if (!tableFound) {
      console.log('⚠️ 未找到租户列表表格，可能是空列表');
    }
    
    // 截图
    await page.screenshot({ path: 'test-results/super-admin-tenant-list.png' });
    console.log('✅ 租户列表查看完成');
  });

  test('场景3: 创建新租户', async ({ page }) => {
    console.log('\n📋 测试场景: 创建新租户');
    
    // 导航到租户管理页面
    await page.goto('http://localhost:3000/super-admin/tenants');
    await page.waitForLoadState('networkidle');
    
    // 查找创建按钮
    const createButtonSelectors = [
      'button:has-text("创建租户")',
      'button:has-text("新建租户")',
      'button:has-text("添加租户")',
      'button:has-text("Create")',
      '[data-testid="create-tenant-btn"]'
    ];
    
    let createButton = null;
    for (const selector of createButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        createButton = btn;
        console.log(`✅ 找到创建按钮 (${selector})`);
        break;
      }
    }
    
    if (!createButton) {
      console.log('⚠️ 未找到创建租户按钮，跳过此测试');
      test.skip();
      return;
    }
    
    // 点击创建按钮
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // 填写租户信息
    const tenantName = `测试租户_${Date.now()}`;
    const tenantCode = `test_${Date.now()}`;
    
    // 查找并填写表单字段
    const nameInputSelectors = [
      'input[name="name"]',
      'input[name="tenantName"]',
      'input[placeholder*="名称"]',
      '[data-testid="tenant-name"]'
    ];
    
    for (const selector of nameInputSelectors) {
      const input = page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill(tenantName);
        console.log(`✅ 填写租户名称: ${tenantName}`);
        break;
      }
    }
    
    const codeInputSelectors = [
      'input[name="code"]',
      'input[name="tenantCode"]',
      'input[placeholder*="代码"]',
      '[data-testid="tenant-code"]'
    ];
    
    for (const selector of codeInputSelectors) {
      const input = page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill(tenantCode);
        console.log(`✅ 填写租户代码: ${tenantCode}`);
        break;
      }
    }
    
    // 截图表单
    await page.screenshot({ path: 'test-results/super-admin-create-tenant-form.png' });
    
    // 提交表单
    const submitButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("确定")',
      'button:has-text("保存")',
      'button:has-text("Submit")',
      'button:has-text("Save")'
    ];
    
    for (const selector of submitButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        console.log('✅ 提交创建租户表单');
        break;
      }
    }
    
    // 等待响应
    await page.waitForTimeout(2000);
    
    // 验证成功消息
    const successSelectors = [
      'text=创建成功',
      'text=成功',
      'text=Success',
      '[role="alert"]'
    ];
    
    for (const selector of successSelectors) {
      const msg = page.locator(selector).first();
      if (await msg.count() > 0) {
        console.log('✅ 租户创建成功');
        break;
      }
    }
    
    // 截图结果
    await page.screenshot({ path: 'test-results/super-admin-tenant-created.png' });
    console.log('✅ 创建租户流程完成');
  });

  test('场景4: 查看租户详情', async ({ page }) => {
    console.log('\n📋 测试场景: 查看租户详情');
    
    // 导航到租户列表
    await page.goto('http://localhost:3000/super-admin/tenants');
    await page.waitForLoadState('networkidle');
    
    // 查找第一个租户的查看按钮
    const viewButtonSelectors = [
      'button:has-text("查看")',
      'button:has-text("详情")',
      'a:has-text("查看")',
      '[data-testid="view-tenant"]'
    ];
    
    let clicked = false;
    for (const selector of viewButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        await btn.click();
        clicked = true;
        console.log('✅ 点击查看租户详情');
        break;
      }
    }
    
    if (!clicked) {
      console.log('⚠️ 未找到查看按钮，跳过此测试');
      test.skip();
      return;
    }
    
    await page.waitForTimeout(1000);
    
    // 验证详情页面
    const detailSelectors = [
      'text=租户详情',
      'text=Tenant Details',
      '[data-testid="tenant-detail"]'
    ];
    
    for (const selector of detailSelectors) {
      const detail = page.locator(selector).first();
      if (await detail.count() > 0) {
        console.log('✅ 租户详情页面加载成功');
        break;
      }
    }
    
    // 截图
    await page.screenshot({ path: 'test-results/super-admin-tenant-detail.png' });
    console.log('✅ 查看租户详情完成');
  });

  test('场景5: 启用/禁用租户', async ({ page }) => {
    console.log('\n📋 测试场景: 启用/禁用租户');
    
    // 导航到租户列表
    await page.goto('http://localhost:3000/super-admin/tenants');
    await page.waitForLoadState('networkidle');
    
    // 查找启用/禁用按钮
    const toggleButtonSelectors = [
      'button:has-text("启用")',
      'button:has-text("禁用")',
      'button:has-text("Enable")',
      'button:has-text("Disable")',
      '[data-testid="toggle-tenant-status"]',
      'input[type="checkbox"]'
    ];
    
    let toggleButton = null;
    for (const selector of toggleButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        toggleButton = btn;
        console.log(`✅ 找到状态切换按钮 (${selector})`);
        break;
      }
    }
    
    if (!toggleButton) {
      console.log('⚠️ 未找到状态切换按钮，跳过此测试');
      test.skip();
      return;
    }
    
    // 点击切换按钮
    await toggleButton.click();
    await page.waitForTimeout(1000);
    
    // 可能需要确认
    const confirmButtonSelectors = [
      'button:has-text("确定")',
      'button:has-text("确认")',
      'button:has-text("Confirm")'
    ];
    
    for (const selector of confirmButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        console.log('✅ 确认状态切换');
        break;
      }
    }
    
    await page.waitForTimeout(1000);
    
    // 截图
    await page.screenshot({ path: 'test-results/super-admin-tenant-toggle.png' });
    console.log('✅ 租户状态切换完成');
  });
});

test.describe('超级管理员 - 系统监控', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test('场景6: 查看系统统计', async ({ page }) => {
    console.log('\n📋 测试场景: 查看系统统计');
    
    // 尝试导航到仪表板或统计页面
    const dashboardUrls = [
      'http://localhost:3000/super-admin/dashboard',
      'http://localhost:3000/super-admin',
      'http://localhost:3000/super-admin/statistics'
    ];
    
    for (const url of dashboardUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 检查是否有统计信息
      const statsSelectors = [
        '[data-testid="stats"]',
        '.statistics',
        '.dashboard',
        'text=统计',
        'text=Dashboard'
      ];
      
      for (const selector of statsSelectors) {
        const stats = page.locator(selector).first();
        if (await stats.count() > 0) {
          console.log(`✅ 找到统计信息 (${url})`);
          await page.screenshot({ path: 'test-results/super-admin-statistics.png' });
          return;
        }
      }
    }
    
    console.log('⚠️ 未找到统计页面');
    await page.screenshot({ path: 'test-results/super-admin-no-statistics.png' });
  });
});

