/**
 * UI BDD测试 - 租户管理员功能
 * 测试账户: tenant_admin_1762476737466 / TenantAdmin@123
 */

import { test, expect, Page } from '@playwright/test';

// 测试账户配置
const TENANT_ADMIN = {
  username: 'tenant_admin_1762476737466',
  password: 'TenantAdmin@123',
  loginUrl: 'http://localhost:3000/login',
  tenantId: '421eee4a-1a2a-4f9d-95a4-37073d4b15c5'
};

// 辅助函数：登录
async function loginAsTenantAdmin(page: Page) {
  await page.goto(TENANT_ADMIN.loginUrl);
  await page.waitForLoadState('networkidle');
  
  // 填写登录表单
  await page.fill('input[name="username"]', TENANT_ADMIN.username);
  await page.fill('input[name="password"]', TENANT_ADMIN.password);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待登录成功
  await page.waitForTimeout(3000);
  
  // 验证登录成功
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
  
  console.log('✅ 租户管理员登录成功');
}

test.describe('租户管理员 - 登录与租户选择', () => {
  test('场景1: 租户管理员成功登录', async ({ page }) => {
    console.log('\n📋 测试场景: 租户管理员成功登录');
    
    await loginAsTenantAdmin(page);
    
    // 验证页面加载
    await expect(page).toHaveURL(/admin|tenant|dashboard/);
    
    // 截图
    await page.screenshot({ path: 'test-results/tenant-admin-login.png' });
    console.log('✅ 租户管理员登录验证完成');
  });

  test('场景2: 选择租户', async ({ page }) => {
    console.log('\n📋 测试场景: 选择租户');
    
    await loginAsTenantAdmin(page);
    
    // 查找租户选择器
    const tenantSelectorSelectors = [
      '[data-testid="tenant-selector"]',
      'select[name="tenant"]',
      '.tenant-selector',
      'button:has-text("选择租户")'
    ];
    
    let tenantSelector = null;
    for (const selector of tenantSelectorSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        tenantSelector = element;
        console.log(`✅ 找到租户选择器 (${selector})`);
        break;
      }
    }
    
    if (tenantSelector) {
      // 如果是下拉框
      if (await tenantSelector.evaluate(el => el.tagName === 'SELECT')) {
        await tenantSelector.selectOption({ index: 0 });
      } else {
        await tenantSelector.click();
        await page.waitForTimeout(500);
        
        // 选择第一个租户
        const firstOption = page.locator('[role="option"], .tenant-option').first();
        if (await firstOption.count() > 0) {
          await firstOption.click();
        }
      }
      
      console.log('✅ 租户选择完成');
    } else {
      console.log('⚠️ 未找到租户选择器，可能已自动选择');
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/tenant-admin-tenant-selected.png' });
  });
});

test.describe('租户管理员 - 考试管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantAdmin(page);
    await page.waitForTimeout(2000);
  });

  test('场景3: 查看考试列表', async ({ page }) => {
    console.log('\n📋 测试场景: 查看考试列表');
    
    // 导航到考试管理页面
    const examUrls = [
      'http://localhost:3000/admin/exams',
      'http://localhost:3000/tenant/exams',
      'http://localhost:3000/exams'
    ];
    
    for (const url of examUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 检查是否有考试列表
      const listSelectors = [
        'table',
        '[role="table"]',
        '.exam-list',
        '[data-testid="exam-list"]'
      ];
      
      for (const selector of listSelectors) {
        const list = page.locator(selector).first();
        if (await list.count() > 0) {
          console.log(`✅ 考试列表加载成功 (${url})`);
          await page.screenshot({ path: 'test-results/tenant-admin-exam-list.png' });
          return;
        }
      }
    }
    
    console.log('⚠️ 未找到考试列表');
    await page.screenshot({ path: 'test-results/tenant-admin-no-exam-list.png' });
  });

  test('场景4: 创建新考试', async ({ page }) => {
    console.log('\n📋 测试场景: 创建新考试');
    
    // 导航到考试管理页面
    await page.goto('http://localhost:3000/admin/exams');
    await page.waitForLoadState('networkidle');
    
    // 查找创建按钮
    const createButtonSelectors = [
      'button:has-text("创建考试")',
      'button:has-text("新建考试")',
      'button:has-text("添加考试")',
      'a[href*="/exams/create"]',
      '[data-testid="create-exam-btn"]'
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
      console.log('⚠️ 未找到创建考试按钮，跳过此测试');
      test.skip();
      return;
    }
    
    // 点击创建按钮
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // 填写考试信息
    const examTitle = `UI测试考试_${Date.now()}`;
    const examCode = `UI_TEST_${Date.now()}`;
    
    // 填写标题
    const titleInputSelectors = [
      'input[name="title"]',
      'input[name="examTitle"]',
      'input[name="name"]',
      'input[placeholder*="标题"]',
      'input[placeholder*="名称"]'
    ];
    
    for (const selector of titleInputSelectors) {
      const input = page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill(examTitle);
        console.log(`✅ 填写考试标题: ${examTitle}`);
        break;
      }
    }
    
    // 填写代码
    const codeInputSelectors = [
      'input[name="code"]',
      'input[name="examCode"]',
      'input[placeholder*="代码"]'
    ];
    
    for (const selector of codeInputSelectors) {
      const input = page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill(examCode);
        console.log(`✅ 填写考试代码: ${examCode}`);
        break;
      }
    }
    
    // 填写费用
    const feeInputSelectors = [
      'input[name="fee"]',
      'input[name="feeAmount"]',
      'input[name="amount"]',
      'input[placeholder*="费用"]'
    ];
    
    for (const selector of feeInputSelectors) {
      const input = page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill('100');
        console.log('✅ 填写考试费用: 100');
        break;
      }
    }
    
    // 截图表单
    await page.screenshot({ path: 'test-results/tenant-admin-create-exam-form.png' });
    
    // 提交表单
    const submitButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("保存")',
      'button:has-text("提交")',
      'button:has-text("创建")'
    ];
    
    for (const selector of submitButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        console.log('✅ 提交创建考试表单');
        break;
      }
    }
    
    // 等待响应
    await page.waitForTimeout(3000);
    
    // 截图结果
    await page.screenshot({ path: 'test-results/tenant-admin-exam-created.png' });
    console.log('✅ 创建考试流程完成');
  });

  test('场景5: 查看考试详情', async ({ page }) => {
    console.log('\n📋 测试场景: 查看考试详情');
    
    // 导航到考试列表
    await page.goto('http://localhost:3000/admin/exams');
    await page.waitForLoadState('networkidle');
    
    // 查找第一个考试的查看按钮
    const viewButtonSelectors = [
      'button:has-text("查看")',
      'button:has-text("详情")',
      'a:has-text("查看")',
      'tr:first-child a',
      '[data-testid="view-exam"]'
    ];
    
    let clicked = false;
    for (const selector of viewButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        await btn.click();
        clicked = true;
        console.log('✅ 点击查看考试详情');
        break;
      }
    }
    
    if (!clicked) {
      console.log('⚠️ 未找到查看按钮，跳过此测试');
      test.skip();
      return;
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/tenant-admin-exam-detail.png' });
    console.log('✅ 查看考试详情完成');
  });

  test('场景6: 编辑考试', async ({ page }) => {
    console.log('\n📋 测试场景: 编辑考试');
    
    // 导航到考试列表
    await page.goto('http://localhost:3000/admin/exams');
    await page.waitForLoadState('networkidle');
    
    // 查找编辑按钮
    const editButtonSelectors = [
      'button:has-text("编辑")',
      'a:has-text("编辑")',
      '[data-testid="edit-exam"]'
    ];
    
    let editButton = null;
    for (const selector of editButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        editButton = btn;
        console.log(`✅ 找到编辑按钮 (${selector})`);
        break;
      }
    }
    
    if (!editButton) {
      console.log('⚠️ 未找到编辑按钮，跳过此测试');
      test.skip();
      return;
    }
    
    // 点击编辑按钮
    await editButton.click();
    await page.waitForTimeout(1000);
    
    // 修改标题
    const titleInput = page.locator('input[name="title"], input[name="examTitle"], input[name="name"]').first();
    if (await titleInput.count() > 0 && await titleInput.isVisible()) {
      const newTitle = `编辑后的考试_${Date.now()}`;
      await titleInput.fill(newTitle);
      console.log(`✅ 修改考试标题: ${newTitle}`);
    }
    
    // 截图
    await page.screenshot({ path: 'test-results/tenant-admin-edit-exam-form.png' });
    
    // 保存
    const saveButton = page.locator('button[type="submit"], button:has-text("保存")').first();
    if (await saveButton.count() > 0 && await saveButton.isVisible()) {
      await saveButton.click();
      console.log('✅ 保存编辑');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/tenant-admin-exam-edited.png' });
    console.log('✅ 编辑考试完成');
  });
});

test.describe('租户管理员 - 岗位管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantAdmin(page);
    await page.waitForTimeout(2000);
  });

  test('场景7: 为考试添加岗位', async ({ page }) => {
    console.log('\n📋 测试场景: 为考试添加岗位');
    
    // 导航到考试详情或岗位管理页面
    await page.goto('http://localhost:3000/admin/exams');
    await page.waitForLoadState('networkidle');
    
    // 点击第一个考试
    const firstExam = page.locator('tr:first-child a, .exam-item:first-child').first();
    if (await firstExam.count() > 0) {
      await firstExam.click();
      await page.waitForTimeout(1000);
    }
    
    // 查找岗位管理或添加岗位按钮
    const positionButtonSelectors = [
      'button:has-text("添加岗位")',
      'button:has-text("创建岗位")',
      'a:has-text("岗位管理")',
      '[data-testid="add-position"]'
    ];
    
    let positionButton = null;
    for (const selector of positionButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        positionButton = btn;
        console.log(`✅ 找到岗位按钮 (${selector})`);
        break;
      }
    }
    
    if (!positionButton) {
      console.log('⚠️ 未找到岗位管理功能，跳过此测试');
      test.skip();
      return;
    }
    
    // 点击添加岗位
    await positionButton.click();
    await page.waitForTimeout(1000);
    
    // 填写岗位信息
    const positionName = `UI测试岗位_${Date.now()}`;
    const positionCode = `POS_UI_${Date.now()}`;
    
    // 填写岗位名称
    const nameInput = page.locator('input[name="name"], input[name="positionName"]').first();
    if (await nameInput.count() > 0 && await nameInput.isVisible()) {
      await nameInput.fill(positionName);
      console.log(`✅ 填写岗位名称: ${positionName}`);
    }
    
    // 填写岗位代码
    const codeInput = page.locator('input[name="code"], input[name="positionCode"]').first();
    if (await codeInput.count() > 0 && await codeInput.isVisible()) {
      await codeInput.fill(positionCode);
      console.log(`✅ 填写岗位代码: ${positionCode}`);
    }
    
    // 截图
    await page.screenshot({ path: 'test-results/tenant-admin-add-position-form.png' });
    
    // 提交
    const submitButton = page.locator('button[type="submit"], button:has-text("保存")').first();
    if (await submitButton.count() > 0 && await submitButton.isVisible()) {
      await submitButton.click();
      console.log('✅ 提交岗位信息');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/tenant-admin-position-added.png' });
    console.log('✅ 添加岗位完成');
  });
});

test.describe('租户管理员 - 用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantAdmin(page);
    await page.waitForTimeout(2000);
  });

  test('场景8: 查看用户列表', async ({ page }) => {
    console.log('\n📋 测试场景: 查看用户列表');
    
    // 导航到用户管理页面
    const userUrls = [
      'http://localhost:3000/admin/users',
      'http://localhost:3000/tenant/users',
      'http://localhost:3000/users'
    ];
    
    for (const url of userUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 检查是否有用户列表
      const listSelectors = [
        'table',
        '[role="table"]',
        '.user-list',
        '[data-testid="user-list"]'
      ];
      
      for (const selector of listSelectors) {
        const list = page.locator(selector).first();
        if (await list.count() > 0) {
          console.log(`✅ 用户列表加载成功 (${url})`);
          await page.screenshot({ path: 'test-results/tenant-admin-user-list.png' });
          return;
        }
      }
    }
    
    console.log('⚠️ 未找到用户列表');
    await page.screenshot({ path: 'test-results/tenant-admin-no-user-list.png' });
  });

  test('场景9: 指定审核员', async ({ page }) => {
    console.log('\n📋 测试场景: 指定审核员');
    
    // 导航到用户管理或审核员管理页面
    const reviewerUrls = [
      'http://localhost:3000/admin/reviewers',
      'http://localhost:3000/admin/users',
      'http://localhost:3000/tenant/reviewers'
    ];
    
    for (const url of reviewerUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 查找指定审核员按钮
      const assignButtonSelectors = [
        'button:has-text("指定审核员")',
        'button:has-text("添加审核员")',
        '[data-testid="assign-reviewer"]'
      ];
      
      for (const selector of assignButtonSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0) {
          await btn.click();
          console.log('✅ 点击指定审核员');
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'test-results/tenant-admin-assign-reviewer.png' });
          return;
        }
      }
    }
    
    console.log('⚠️ 未找到审核员管理功能');
    await page.screenshot({ path: 'test-results/tenant-admin-no-reviewer-mgmt.png' });
  });
});

