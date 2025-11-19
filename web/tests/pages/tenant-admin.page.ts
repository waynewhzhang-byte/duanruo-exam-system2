import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 租户管理员管理页面对象模型
 */
export class TenantAdminPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * 导航到用户管理页面
   */
  async gotoUserManagement(): Promise<void> {
    await super.goto('/admin/users');
    await this.waitForPageLoad();
  }

  /**
   * 点击租户管理员卡片
   */
  async clickTenantAdminCard(): Promise<void> {
    // 查找包含"租户管理员"文本的卡片
    const card = this.page.locator('text=租户管理员').locator('..').locator('..');
    await card.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 填写用户名
   */
  async fillUsername(username: string): Promise<void> {
    const input = this.page.locator('input[name="username"], input[placeholder*="用户名"]').first();
    await input.fill(username);
  }

  /**
   * 填写邮箱
   */
  async fillEmail(email: string): Promise<void> {
    const input = this.page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    await input.fill(email);
  }

  /**
   * 填写密码
   */
  async fillPassword(password: string): Promise<void> {
    const input = this.page.locator('input[type="password"][name="password"], input[placeholder*="密码"]').first();
    await input.fill(password);
  }

  /**
   * 填写确认密码
   */
  async fillConfirmPassword(password: string): Promise<void> {
    const input = this.page.locator('input[type="password"][name="confirmPassword"], input[placeholder*="确认密码"]').first();
    await input.fill(password);
  }

  /**
   * 选择租户
   */
  async selectTenant(tenantName: string): Promise<void> {
    // 点击租户选择下拉框
    const selectTrigger = this.page.locator('[role="combobox"]').filter({ hasText: /请选择租户|选择租户/ });
    await selectTrigger.click();
    await this.page.waitForTimeout(500);

    // 选择租户选项
    const option = this.page.locator(`[role="option"]:has-text("${tenantName}")`).first();
    await option.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 点击创建用户按钮
   */
  async clickCreateUser(): Promise<void> {
    const button = this.page.locator('button:has-text("创建用户")').first();
    await button.click();
  }

  /**
   * 创建租户管理员
   */
  async createTenantAdmin(username: string, email: string, password: string, tenantName: string): Promise<void> {
    await this.clickTenantAdminCard();
    await this.fillUsername(username);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(password);
    await this.selectTenant(tenantName);
    await this.clickCreateUser();
    
    // 等待创建完成
    await this.page.waitForTimeout(2000);
  }

  /**
   * 验证成功消息
   */
  async verifySuccessMessage(): Promise<boolean> {
    try {
      // 查找成功提示（toast通知）
      const successToast = this.page.locator('[role="status"], .toast, text=成功').first();
      await successToast.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证租户选择下拉框是否显示
   */
  async verifyTenantSelectVisible(): Promise<boolean> {
    const selectTrigger = this.page.locator('[role="combobox"]').filter({ hasText: /请选择租户|选择租户/ });
    return await selectTrigger.isVisible();
  }

  /**
   * 获取租户选项列表
   */
  async getTenantOptions(): Promise<string[]> {
    // 点击租户选择下拉框
    const selectTrigger = this.page.locator('[role="combobox"]').filter({ hasText: /请选择租户|选择租户/ });
    await selectTrigger.click();
    await this.page.waitForTimeout(500);

    // 获取所有选项
    const options = this.page.locator('[role="option"]');
    const count = await options.count();
    const tenantNames: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) {
        tenantNames.push(text.trim());
      }
    }

    // 关闭下拉框
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);

    return tenantNames;
  }

  /**
   * 验证用户管理页面元素
   */
  async verifyUserManagementPage(): Promise<void> {
    // 验证页面标题
    await expect(this.page.locator('h1, h2').filter({ hasText: /用户管理/ })).toBeVisible();

    // 验证角色卡片
    const roleCards = [
      '系统管理员',
      '租户管理员',
      '考试管理员',
      '初审员',
      '复审员'
    ];

    for (const role of roleCards) {
      const card = this.page.locator(`text=${role}`).first();
      await expect(card).toBeVisible();
    }
  }

  /**
   * 登录为租户管理员
   */
  async loginAsTenantAdmin(username: string, password: string): Promise<void> {
    await super.goto('/login?role=admin');
    await this.waitForPageLoad();

    // 填写登录信息
    await this.page.locator('input[name="username"], input[placeholder*="用户名"]').fill(username);
    await this.page.locator('input[type="password"]').fill(password);
    await this.page.locator('button:has-text("登录")').click();

    // 等待登录完成
    await this.page.waitForTimeout(3000);
  }

  /**
   * 验证租户管理员权限 - 可以访问租户下的考试管理
   */
  async verifyTenantAdminCanAccessExams(tenantSlug: string): Promise<boolean> {
    try {
      await super.goto(`/${tenantSlug}/admin/exams`);
      await this.waitForPageLoad();

      // 验证可以看到考试列表页面
      const pageTitle = this.page.locator('h1, h2').filter({ hasText: /考试|管理/ });
      await pageTitle.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证租户管理员权限 - 不能访问其他租户的考试
   */
  async verifyTenantAdminCannotAccessOtherTenants(otherTenantSlug: string): Promise<boolean> {
    try {
      await super.goto(`/${otherTenantSlug}/admin/exams`);
      await this.page.waitForTimeout(2000);

      // 检查是否被重定向或显示权限错误
      const currentUrl = this.page.url();
      const hasError = await this.page.locator('text=权限|403|Forbidden|无权限').isVisible().catch(() => false);

      // 如果URL没有变化且没有错误，说明可以访问（不应该）
      if (currentUrl.includes(otherTenantSlug) && !hasError) {
        return false; // 不应该能访问
      }

      return true; // 正确地被拒绝访问
    } catch {
      return true; // 访问失败，说明权限正确
    }
  }

  /**
   * 验证租户管理员权限 - 不能访问系统管理功能
   */
  async verifyTenantAdminCannotAccessSystemAdmin(): Promise<boolean> {
    try {
      await super.goto('/admin/tenants');
      await this.page.waitForTimeout(2000);

      // 检查是否被重定向或显示权限错误
      const currentUrl = this.page.url();
      const hasError = await this.page.locator('text=权限|403|Forbidden|无权限').isVisible().catch(() => false);

      // 如果可以访问租户管理页面，说明权限不正确
      if (currentUrl.includes('/admin/tenants') && !hasError) {
        return false; // 不应该能访问
      }

      return true; // 正确地被拒绝访问
    } catch {
      return true; // 访问失败，说明权限正确
    }
  }

  /**
   * 获取当前用户的租户信息
   */
  async getCurrentTenantInfo(): Promise<{ name: string; slug: string } | null> {
    try {
      // 查找显示当前租户的元素
      const tenantInfo = this.page.locator('text=当前租户').locator('..').locator('span, strong');
      const tenantName = await tenantInfo.textContent();

      if (tenantName) {
        return {
          name: tenantName.trim(),
          slug: '' // 需要从URL或其他地方获取
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 验证租户管理员可以创建考试
   */
  async verifyCanCreateExam(tenantSlug: string): Promise<boolean> {
    try {
      await super.goto(`/${tenantSlug}/admin/exams`);
      await this.waitForPageLoad();

      // 查找"创建考试"或"新建考试"按钮
      const createButton = this.page.locator('button:has-text("创建考试"), button:has-text("新建考试"), a:has-text("创建考试")').first();
      await createButton.waitFor({ state: 'visible', timeout: 5000 });

      return true;
    } catch {
      return false;
    }
  }
}

