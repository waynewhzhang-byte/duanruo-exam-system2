/**
 * 认证相关步骤定义
 */

import { Given, When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';

/**
 * 角色登录步骤
 */
Given('我已登录为考生', async function (this: CustomWorld) {
  this.log('使用考生账号登录');
  await this.goto('/login');
  await this.waitForPageLoad();

  await this.page.fill('input[name="username"]', 'bdd_candidate');
  await this.page.fill('input[name="password"]', 'Candidate123!@#');

  // 等待登录API和session API完成
  const [loginResponse, sessionResponse] = await Promise.all([
    this.page.waitForResponse(resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200),
    this.page.waitForResponse(resp => resp.url().includes('/api/session') && resp.status() === 200),
    this.page.click('button:has-text("登录")'),
  ]);

  // 获取token
  const loginData = await loginResponse.json();
  const token = loginData.token;

  await this.waitForPageLoad();
  this.currentUser = {
    username: 'bdd_candidate',
    password: 'Candidate123!@#',
    role: 'CANDIDATE',
    token
  };
  this.testData.token = token;
  this.log(`✅ 考生登录成功, token: ${token.substring(0, 20)}...`);
});

Given('我已登录为租户管理员', async function (this: CustomWorld) {
  this.log('使用租户管理员账号登录');
  await this.goto('/login?role=admin');
  await this.waitForPageLoad();

  await this.page.fill('input[name="username"]', 'tenant_admin');
  await this.page.fill('input[name="password"]', 'TenantAdmin123!@#');

  // 等待登录API和session API完成
  const [loginResponse, sessionResponse] = await Promise.all([
    this.page.waitForResponse(resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200),
    this.page.waitForResponse(resp => resp.url().includes('/api/session') && resp.status() === 200),
    this.page.click('button:has-text("登录")'),
  ]);

  // 获取token
  const loginData = await loginResponse.json();
  const token = loginData.token;

  await this.waitForPageLoad();

  // 选择租户 - 使用租户名称而不是slug
  const tenantSlug = 'test-company-a';
  const tenantName = '测试企业A';
  await this.page.waitForSelector(`text=${tenantName}`, { timeout: 10000 });
  await this.page.click(`text=${tenantName}`);
  await this.waitForPageLoad();

  this.currentUser = {
    username: 'tenant_admin',
    password: 'TenantAdmin123!@#',
    role: 'TENANT_ADMIN',
    token
  };
  this.testData.tenantSlug = tenantSlug;
  this.testData.token = token;
  this.log(`✅ 租户管理员登录成功, token: ${token.substring(0, 20)}...`);
});

Given('我已登录为一级审核员', async function (this: CustomWorld) {
  this.log('使用一级审核员账号登录');

  try {
    await this.goto('/login?role=reviewer');
    await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });

    await this.page.fill('input[name="username"]', 'bdd_reviewer1');
    await this.page.fill('input[name="password"]', 'Reviewer123!@#');

    // 等待登录API和session API完成
    const [loginResponse, sessionResponse] = await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200),
      this.page.waitForResponse(resp => resp.url().includes('/api/session') && resp.status() === 200),
      this.page.click('button:has-text("登录")'),
    ]);

    // 获取token
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // 等待登录完成 - 可能跳转到租户选择页面或直接进入系统
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // 检查是否需要选择租户 - 修复：使用正确的slug（带连字符）
    const tenantSlug = 'test-company-a';
    const hasTenantSelector = await this.page.locator(`text=${tenantSlug}`).count() > 0;

    if (hasTenantSelector) {
      this.log('选择租户...');
      await this.page.click(`text=${tenantSlug}`);
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    }

    // 等待一下让页面稳定
    await this.page.waitForTimeout(2000);

    this.currentUser = {
      username: 'bdd_reviewer1',
      password: 'Reviewer123!@#',
      role: 'PRIMARY_REVIEWER',
      token
    };
    this.testData.tenantSlug = tenantSlug;
    this.testData.token = token;
    this.log(`✅ 一级审核员登录成功, token: ${token.substring(0, 20)}...`);
  } catch (error) {
    this.log(`❌ 一级审核员登录失败: ${error}`);
    throw error;
  }
});

Given('我已登录为二级审核员', async function (this: CustomWorld) {
  this.log('使用二级审核员账号登录');

  try {
    await this.goto('/login?role=reviewer');
    await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });

    await this.page.fill('input[name="username"]', 'bdd_reviewer2');
    await this.page.fill('input[name="password"]', 'Reviewer123!@#');

    // 等待登录API和session API完成
    const [loginResponse, sessionResponse] = await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200),
      this.page.waitForResponse(resp => resp.url().includes('/api/session') && resp.status() === 200),
      this.page.click('button:has-text("登录")'),
    ]);

    // 获取token
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // 等待登录完成 - 可能跳转到租户选择页面或直接进入系统
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // 检查是否需要选择租户 - 修复：使用正确的slug（带连字符）
    const tenantSlug = 'test-company-a';
    const hasTenantSelector = await this.page.locator(`text=${tenantSlug}`).count() > 0;

    if (hasTenantSelector) {
      this.log('选择租户...');
      await this.page.click(`text=${tenantSlug}`);
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    }

    // 等待一下让页面稳定
    await this.page.waitForTimeout(2000);

    this.currentUser = {
      username: 'bdd_reviewer2',
      password: 'Reviewer123!@#',
      role: 'SECONDARY_REVIEWER',
      token
    };
    this.testData.tenantSlug = tenantSlug;
    this.testData.token = token;
    this.log(`✅ 二级审核员登录成功, token: ${token.substring(0, 20)}...`);
  } catch (error) {
    this.log(`❌ 二级审核员登录失败: ${error}`);
    throw error;
  }
});

Given('我已登录为超级管理员', async function (this: CustomWorld) {
  this.log('使用超级管理员账号登录');
  await this.goto('/login?role=super-admin');
  await this.waitForPageLoad();

  await this.page.fill('input[name="username"]', 'super_admin');
  await this.page.fill('input[name="password"]', 'SuperAdmin123!@#');

  // 等待登录API和session API完成
  const [loginResponse, sessionResponse] = await Promise.all([
    this.page.waitForResponse(resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200),
    this.page.waitForResponse(resp => resp.url().includes('/api/session') && resp.status() === 200),
    this.page.click('button:has-text("登录")'),
  ]);

  // 获取token
  const loginData = await loginResponse.json();
  const token = loginData.token;

  await this.waitForPageLoad();

  this.currentUser = {
    username: 'super_admin',
    password: 'SuperAdmin123!@#',
    role: 'SUPER_ADMIN',
    token
  };
  this.testData.token = token;
  this.log(`✅ 超级管理员登录成功, token: ${token.substring(0, 20)}...`);
});

/**
 * 账号存在性验证步骤
 */
Given('存在一级审核员账号 {string}', async function (this: CustomWorld, username: string) {
  this.log(`验证一级审核员账号存在: ${username}`);
  // 账号由测试数据准备脚本创建
  this.testData.reviewer1Username = username;
});

Given('存在二级审核员账号 {string}', async function (this: CustomWorld, username: string) {
  this.log(`验证二级审核员账号存在: ${username}`);
  // 账号由测试数据准备脚本创建
  this.testData.reviewer2Username = username;
});

/**
 * 通用审核员登录步骤
 */
Given('我已登录为审核员', async function (this: CustomWorld) {
  this.log('使用审核员账号登录（默认一级审核员）');

  try {
    await this.goto('/login?role=reviewer');
    await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });

    await this.page.fill('input[name="username"]', 'bdd_reviewer1');
    await this.page.fill('input[name="password"]', 'Reviewer123!@#');

    // 等待登录API和session API完成
    const [loginResponse, sessionResponse] = await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200),
      this.page.waitForResponse(resp => resp.url().includes('/api/session') && resp.status() === 200),
      this.page.click('button:has-text("登录")'),
    ]);

    // 获取token
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // 等待登录完成 - 可能跳转到租户选择页面或直接进入系统
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // 检查是否需要选择租户 - 修复：使用正确的slug（带连字符）
    const tenantSlug = 'test-company-a';
    const hasTenantSelector = await this.page.locator(`text=${tenantSlug}`).count() > 0;

    if (hasTenantSelector) {
      this.log('选择租户...');
      await this.page.click(`text=${tenantSlug}`);
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    }

    // 等待一下让页面稳定
    await this.page.waitForTimeout(2000);

    this.currentUser = {
      username: 'bdd_reviewer1',
      password: 'Reviewer123!@#',
      role: 'REVIEWER',
      token
    };
    this.testData.tenantSlug = tenantSlug;
    this.testData.token = token;
    this.log(`✅ 审核员登录成功, token: ${token.substring(0, 20)}...`);
  } catch (error) {
    this.log(`❌ 审核员登录失败: ${error}`);
    throw error;
  }
});

