/**
 * 租户管理员创建和权限测试
 * 
 * 测试场景：
 * 1. 系统管理员创建租户管理员账户
 * 2. 关联租户管理员到特定租户
 * 3. 验证租户管理员的权限范围
 * 4. 验证租户管理员不能访问其他租户
 * 5. 验证租户管理员不能访问系统管理功能
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { TenantAdminPage } from '../../pages/tenant-admin.page';
import { ServiceManager } from '../../utils/service-manager';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('租户管理员创建和权限测试', () => {
  let loginPage: LoginPage;
  let tenantAdminPage: TenantAdminPage;
  let serviceManager: ServiceManager;

  // 测试数据
  const testTenantAdmin = {
    username: `tenant_admin_${Date.now()}`,
    email: `tenant_admin_${Date.now()}@test.com`,
    password: 'TenantAdmin123!',
    tenantName: '默认租户', // 将关联到默认租户
    tenantSlug: 'default'
  };

  const otherTenantSlug = 'company_a'; // 其他租户，用于测试权限隔离

  test.beforeAll(async () => {
    serviceManager = new ServiceManager();

    // 启动所有服务
    console.log('启动测试环境...');
    const servicesStarted = await serviceManager.startAllServices();

    if (!servicesStarted) {
      throw new Error('服务启动失败，无法进行测试');
    }

    // 准备测试数据
    await serviceManager.prepareTestData();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    tenantAdminPage = new TenantAdminPage(page);
  });

  test('步骤1: 系统管理员登录', async () => {
    console.log('测试: 系统管理员登录');

    // 导航到管理员登录页面
    await loginPage.goto('admin');

    // 使用系统管理员凭据登录
    await loginPage.loginAsAdmin();

    // 验证登录成功
    await loginPage.waitForPageLoad();
    const currentUrl = loginPage.page.url();
    expect(currentUrl).toMatch(/\/(tenants|admin)/);

    // 截图
    await tenantAdminPage.takeScreenshot('01-system-admin-login');

    console.log('✓ 系统管理员登录成功');
  });

  test('步骤2: 访问用户管理页面', async () => {
    console.log('测试: 访问用户管理页面');

    // 先登录
    await loginPage.goto('admin');
    await loginPage.loginAsAdmin();
    await loginPage.waitForPageLoad();

    // 导航到用户管理页面
    await tenantAdminPage.gotoUserManagement();

    // 验证页面元素
    await tenantAdminPage.verifyUserManagementPage();

    // 截图
    await tenantAdminPage.takeScreenshot('02-user-management-page');

    console.log('✓ 用户管理页面加载成功');
  });

  test('步骤3: 验证租户管理员角色卡片', async () => {
    console.log('测试: 验证租户管理员角色卡片');

    // 先登录并导航到用户管理页面
    await loginPage.goto('admin');
    await loginPage.loginAsAdmin();
    await loginPage.waitForPageLoad();
    await tenantAdminPage.gotoUserManagement();

    // 验证租户管理员卡片存在
    const tenantAdminCard = tenantAdminPage.page.locator('text=租户管理员').first();
    await expect(tenantAdminCard).toBeVisible();

    // 验证卡片描述
    const cardDescription = tenantAdminPage.page.locator('text=管理特定租户').first();
    await expect(cardDescription).toBeVisible();

    // 截图
    await tenantAdminPage.takeScreenshot('03-tenant-admin-card');

    console.log('✓ 租户管理员角色卡片验证成功');
  });

  test('步骤4: 点击租户管理员卡片并验证表单', async () => {
    console.log('测试: 点击租户管理员卡片并验证表单');

    // 先登录并导航到用户管理页面
    await loginPage.goto('admin');
    await loginPage.loginAsAdmin();
    await loginPage.waitForPageLoad();
    await tenantAdminPage.gotoUserManagement();

    // 点击租户管理员卡片
    await tenantAdminPage.clickTenantAdminCard();

    // 验证表单字段
    await expect(tenantAdminPage.page.locator('input[name="username"], input[placeholder*="用户名"]')).toBeVisible();
    await expect(tenantAdminPage.page.locator('input[type="email"]')).toBeVisible();
    await expect(tenantAdminPage.page.locator('input[type="password"]').first()).toBeVisible();

    // 验证租户选择下拉框显示
    const hasTenantSelect = await tenantAdminPage.verifyTenantSelectVisible();
    expect(hasTenantSelect).toBeTruthy();

    // 截图
    await tenantAdminPage.takeScreenshot('04-tenant-admin-form');

    console.log('✓ 租户管理员表单验证成功');
  });

  test('步骤5: 验证租户选项列表', async () => {
    console.log('测试: 验证租户选项列表');

    // 先登录并导航到用户管理页面
    await loginPage.goto('admin');
    await loginPage.loginAsAdmin();
    await loginPage.waitForPageLoad();
    await tenantAdminPage.gotoUserManagement();

    // 点击租户管理员卡片
    await tenantAdminPage.clickTenantAdminCard();

    // 获取租户选项
    const tenantOptions = await tenantAdminPage.getTenantOptions();
    console.log('可用租户:', tenantOptions);

    // 验证至少有一个租户
    expect(tenantOptions.length).toBeGreaterThan(0);

    // 验证包含默认租户
    const hasDefaultTenant = tenantOptions.some(option => 
      option.includes('默认租户') || option.includes('default')
    );
    expect(hasDefaultTenant).toBeTruthy();

    // 截图
    await tenantAdminPage.takeScreenshot('05-tenant-options');

    console.log('✓ 租户选项列表验证成功');
  });

  test('步骤6: 创建租户管理员账户', async () => {
    console.log('测试: 创建租户管理员账户');
    console.log('创建用户:', testTenantAdmin);

    // 先登录并导航到用户管理页面
    await loginPage.goto('admin');
    await loginPage.loginAsAdmin();
    await loginPage.waitForPageLoad();
    await tenantAdminPage.gotoUserManagement();

    // 创建租户管理员
    await tenantAdminPage.createTenantAdmin(
      testTenantAdmin.username,
      testTenantAdmin.email,
      testTenantAdmin.password,
      testTenantAdmin.tenantName
    );

    // 验证成功消息
    const hasSuccess = await tenantAdminPage.verifySuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // 截图
    await tenantAdminPage.takeScreenshot('06-tenant-admin-created');

    console.log('✓ 租户管理员账户创建成功');
  });

  test('步骤7: 使用租户管理员账户登录', async () => {
    console.log('测试: 使用租户管理员账户登录');

    // 先创建租户管理员（如果还没创建）
    await loginPage.goto('admin');
    await loginPage.loginAsAdmin();
    await loginPage.waitForPageLoad();
    await tenantAdminPage.gotoUserManagement();
    
    try {
      await tenantAdminPage.createTenantAdmin(
        testTenantAdmin.username,
        testTenantAdmin.email,
        testTenantAdmin.password,
        testTenantAdmin.tenantName
      );
    } catch (error) {
      console.log('用户可能已存在，继续测试');
    }

    // 登出系统管理员
    await tenantAdminPage.page.goto('/login');
    await tenantAdminPage.page.waitForTimeout(1000);

    // 使用租户管理员登录
    await tenantAdminPage.loginAsTenantAdmin(
      testTenantAdmin.username,
      testTenantAdmin.password
    );

    // 验证登录成功
    const currentUrl = tenantAdminPage.page.url();
    console.log('登录后URL:', currentUrl);

    // 应该跳转到租户管理页面或租户选择页面
    expect(currentUrl).toMatch(/\/(admin|tenants|default)/);

    // 截图
    await tenantAdminPage.takeScreenshot('07-tenant-admin-logged-in');

    console.log('✓ 租户管理员登录成功');
  });

  test('步骤8: 验证租户管理员可以访问所属租户的考试管理', async () => {
    console.log('测试: 验证租户管理员可以访问所属租户的考试管理');

    // 登录租户管理员
    await tenantAdminPage.loginAsTenantAdmin(
      testTenantAdmin.username,
      testTenantAdmin.password
    );

    // 验证可以访问所属租户的考试管理
    const canAccess = await tenantAdminPage.verifyTenantAdminCanAccessExams(testTenantAdmin.tenantSlug);
    expect(canAccess).toBeTruthy();

    // 截图
    await tenantAdminPage.takeScreenshot('08-tenant-admin-access-exams');

    console.log('✓ 租户管理员可以访问所属租户的考试管理');
  });

  test('步骤9: 验证租户管理员不能访问其他租户', async () => {
    console.log('测试: 验证租户管理员不能访问其他租户');

    // 登录租户管理员
    await tenantAdminPage.loginAsTenantAdmin(
      testTenantAdmin.username,
      testTenantAdmin.password
    );

    // 验证不能访问其他租户
    const cannotAccess = await tenantAdminPage.verifyTenantAdminCannotAccessOtherTenants(otherTenantSlug);
    expect(cannotAccess).toBeTruthy();

    // 截图
    await tenantAdminPage.takeScreenshot('09-tenant-admin-cannot-access-other-tenants');

    console.log('✓ 租户管理员正确地被拒绝访问其他租户');
  });

  test('步骤10: 验证租户管理员不能访问系统管理功能', async () => {
    console.log('测试: 验证租户管理员不能访问系统管理功能');

    // 登录租户管理员
    await tenantAdminPage.loginAsTenantAdmin(
      testTenantAdmin.username,
      testTenantAdmin.password
    );

    // 验证不能访问系统管理功能
    const cannotAccess = await tenantAdminPage.verifyTenantAdminCannotAccessSystemAdmin();
    expect(cannotAccess).toBeTruthy();

    // 截图
    await tenantAdminPage.takeScreenshot('10-tenant-admin-cannot-access-system-admin');

    console.log('✓ 租户管理员正确地被拒绝访问系统管理功能');
  });

  test('步骤11: 验证租户管理员可以创建考试', async () => {
    console.log('测试: 验证租户管理员可以创建考试');

    // 登录租户管理员
    await tenantAdminPage.loginAsTenantAdmin(
      testTenantAdmin.username,
      testTenantAdmin.password
    );

    // 验证可以创建考试
    const canCreate = await tenantAdminPage.verifyCanCreateExam(testTenantAdmin.tenantSlug);
    expect(canCreate).toBeTruthy();

    // 截图
    await tenantAdminPage.takeScreenshot('11-tenant-admin-can-create-exam');

    console.log('✓ 租户管理员可以创建考试');
  });

  test('完整流程: 创建租户管理员并验证所有权限', async () => {
    console.log('=== 开始完整流程测试 ===');

    const fullTestAdmin = {
      username: `full_test_admin_${Date.now()}`,
      email: `full_test_${Date.now()}@test.com`,
      password: 'FullTest123!',
      tenantName: '默认租户',
      tenantSlug: 'default'
    };

    // 1. 系统管理员登录
    console.log('1. 系统管理员登录...');
    await loginPage.goto('admin');
    await loginPage.loginAsAdmin();
    await loginPage.waitForPageLoad();

    // 2. 创建租户管理员
    console.log('2. 创建租户管理员...');
    await tenantAdminPage.gotoUserManagement();
    await tenantAdminPage.createTenantAdmin(
      fullTestAdmin.username,
      fullTestAdmin.email,
      fullTestAdmin.password,
      fullTestAdmin.tenantName
    );

    const hasSuccess = await tenantAdminPage.verifySuccessMessage();
    expect(hasSuccess).toBeTruthy();
    console.log('✓ 租户管理员创建成功');

    // 3. 登出并使用租户管理员登录
    console.log('3. 使用租户管理员登录...');
    await tenantAdminPage.page.goto('/login');
    await tenantAdminPage.page.waitForTimeout(1000);
    await tenantAdminPage.loginAsTenantAdmin(fullTestAdmin.username, fullTestAdmin.password);
    console.log('✓ 租户管理员登录成功');

    // 4. 验证权限
    console.log('4. 验证权限...');

    // 4.1 可以访问所属租户
    const canAccessOwn = await tenantAdminPage.verifyTenantAdminCanAccessExams(fullTestAdmin.tenantSlug);
    expect(canAccessOwn).toBeTruthy();
    console.log('✓ 可以访问所属租户的考试管理');

    // 4.2 不能访问其他租户
    const cannotAccessOther = await tenantAdminPage.verifyTenantAdminCannotAccessOtherTenants(otherTenantSlug);
    expect(cannotAccessOther).toBeTruthy();
    console.log('✓ 不能访问其他租户');

    // 4.3 不能访问系统管理
    const cannotAccessSystem = await tenantAdminPage.verifyTenantAdminCannotAccessSystemAdmin();
    expect(cannotAccessSystem).toBeTruthy();
    console.log('✓ 不能访问系统管理功能');

    // 4.4 可以创建考试
    const canCreateExam = await tenantAdminPage.verifyCanCreateExam(fullTestAdmin.tenantSlug);
    expect(canCreateExam).toBeTruthy();
    console.log('✓ 可以创建考试');

    // 最终截图
    await tenantAdminPage.takeScreenshot('12-full-flow-complete');

    console.log('=== 完整流程测试通过 ===');
  });
});

