/**
 * Cucumber World Context
 * 管理测试上下文、浏览器、页面和测试数据
 */

import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { BDD_TEST_USERS } from '../fixtures/bdd-test-data';

export interface TestData {
  [key: string]: any;
  tenantId?: string;
  examId?: string;
  positionId?: string;
  applicationId?: string;
  userId?: string;
  token?: string;
}

/**
 * 自定义World类
 * 在每个场景中可用
 */
export class CustomWorld extends World {
  // Playwright对象
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // Page Objects
  loginPage!: LoginPage;

  // 测试用户
  testUsers = BDD_TEST_USERS;

  // 测试数据
  testData: TestData = {};

  // 当前用户信息
  currentUser?: {
    username: string;
    password: string;
    role: string;
    token?: string;
  };

  constructor(options: IWorldOptions) {
    super(options);
  }

  /**
   * 初始化浏览器和页面
   */
  async init(): Promise<void> {
    // 启动浏览器（支持 DevTools/HAR 调试）
    const openDevtools = process.env.BDD_DEVTOOLS === 'true' || process.env.PWDEBUG === '1';
    const slowMo = process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0;

    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo,
      devtools: openDevtools,
    });

    // 每个场景单独记录 HAR（可选）
    const harEnabled = process.env.BDD_HAR === 'true';
    const ts = Date.now();
    const harPath = `test-results/bdd/har/${ts}.har`;

    // 创建浏览器上下文
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      recordHar: harEnabled ? { path: harPath, content: 'embed' } as any : undefined,
    });

    // 创建页面
    this.page = await this.context.newPage();

    // 初始化Page Objects
    this.loginPage = new LoginPage(this.page);

    // 设置默认超时
    this.page.setDefaultTimeout(30000);
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * 截图
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    const timestamp = new Date().getTime();
    const screenshot = await this.page.screenshot({
      path: `test-results/bdd/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
    return screenshot;
  }

  /**
   * 等待页面加载
   */
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch (error) {
      // 如果networkidle超时，至少等待domcontentloaded
      this.log(`⚠️ networkidle超时，降级为domcontentloaded`);
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    }
  }

  /**
   * 导航到指定路径
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * 获取当前URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * 等待元素可见
   */
  async waitForElement(selector: string, timeout: number = 20000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * 点击元素
   */
  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  /**
   * 填写输入框
   */
  async fill(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  /**
   * 获取文本内容
   */
  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  /**
   * 检查元素是否可见
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  /**
   * 等待API响应
   */
  async waitForApiResponse(urlPattern: string, timeout: number = 10000): Promise<any> {
    const response = await this.page.waitForResponse(
      (response) => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
    return await response.json();
  }

  /**
   * 设置认证Token
   */
  async setAuthToken(token: string): Promise<void> {
    await this.context.addCookies([
      {
        name: 'auth-token',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ]);
  }

  /**
   * 获取认证Token
   */
  async getAuthToken(): Promise<string | undefined> {
    const cookies = await this.context.cookies();
    const authCookie = cookies.find((c) => c.name === 'auth_token');
    return authCookie?.value;
  }

  /**
   * 清除认证
   */
  async clearAuth(): Promise<void> {
    await this.context.clearCookies();
  }

  /**
   * 保存测试数据
   */
  setTestData(key: string, value: any): void {
    this.testData[key] = value;
  }

  /**
   * 获取测试数据
   */
  getTestData(key: string): any {
    return this.testData[key];
  }

  /**
   * 清除测试数据
   */
  clearTestData(): void {
    this.testData = {};
  }

  /**
   * 智能填写字段（支持多种选择器）
   */
  async fillField(fieldName: string, value: string): Promise<void> {
    this.log(`填写字段 ${fieldName}: ${value}`);

    // 等待页面加载完成
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      this.log('  网络未完全空闲,继续执行');
    });

    // 特殊处理：开关/切换类字段（如 feeRequired）
    if (fieldName === 'feeRequired') {
      const desired = String(value).trim().toLowerCase();
      const shouldBeOn = ['true', '1', 'yes', 'y', '是', '开启'].includes(desired);
      const switchSelectors = [
        `#${fieldName}[role="switch"]`,
        `[role="switch"]#${fieldName}`,
        `label[for="${fieldName}"] ~ * [role="switch"]`,
        `label[for="${fieldName}"] + * [role="switch"]`,
      ];
      for (const ss of switchSelectors) {
        const sw = this.page.locator(ss).first();
        if ((await sw.count()) > 0) {
          await sw.waitFor({ state: 'visible', timeout: 20000 });
          const ariaChecked = (await sw.getAttribute('aria-checked')) || 'false';
          const isOn = ariaChecked === 'true';
          if (isOn !== shouldBeOn) {
            await sw.click({ timeout: 10000 });
            this.log(`✅ 切换开关 ${fieldName} -> ${shouldBeOn ? '开' : '关'} (selector: ${ss})`);
          } else {
            this.log(`✅ 开关 ${fieldName} 已是目标状态(${shouldBeOn ? '开' : '关'})`);
          }
          return;
        }
      }
      this.log('⚠️ 未找到开关组件，继续尝试通用输入选择器...');
    }

    // 尝试多种选择器（优先使用id,然后name,最后label）
    const selectors = [
      `input[id="${fieldName}"]`,
      `textarea[id="${fieldName}"]`,
      `select[id="${fieldName}"]`,
      `input[name="${fieldName}"]`,
      `textarea[name="${fieldName}"]`,
      `select[name="${fieldName}"]`,
      `input[data-testid="${fieldName}"]`,
      `textarea[data-testid="${fieldName}"]`,
      `select[data-testid="${fieldName}"]`,
      `input[placeholder*="${fieldName}"]`,
      `textarea[placeholder*="${fieldName}"]`,
      `label[for="${fieldName}"] + input`,
      `label[for="${fieldName}"] + textarea`,
      `label[for="${fieldName}"] + select`,
      `label[for="${fieldName}"] ~ input`,
      `label[for="${fieldName}"] ~ textarea`,
      `label[for="${fieldName}"] ~ select`,
      `label:has-text("${fieldName}") input`,
      `label:has-text("${fieldName}") textarea`,
      `label:has-text("${fieldName}") select`,
    ];

    this.log(`  尝试 ${selectors.length} 种选择器策略...`);

    // 重试逻辑:最多重试3次,每次等待2秒
    for (let retry = 0; retry < 3; retry++) {
      if (retry > 0) {
        this.log(`  第 ${retry + 1} 次尝试...`);
        await this.page.waitForTimeout(2000);
      }

      for (const selector of selectors) {
        try {
          const element = this.page.locator(selector);
          const count = await element.count();

          if (count > 0) {
            this.log(`  找到元素 (选择器: ${selector}, 数量: ${count})`);

            // 等待元素可见和可编辑
            await element.first().waitFor({ state: 'visible', timeout: 20000 });

            // 滚动到元素位置
            await element.first().scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(300);

            const tagName = await element.first().evaluate((el) => el.tagName.toLowerCase());
            const isDisabled = await element.first().isDisabled();

            if (isDisabled) {
              this.log(`  ⚠️ 字段 ${fieldName} 被禁用,跳过`);
              continue;
            }

            if (tagName === 'select') {
              await element.first().selectOption(value);
            } else {
              // 针对特殊类型做适配（如 datetime-local）
              const inputType = await element.first().evaluate((el) => (el as HTMLInputElement).type || '');
              let toFill = value;
              if (inputType === 'datetime-local') {
                // 将 "YYYY-MM-DD HH:mm[:ss]" 转换为 "YYYY-MM-DDTHH:mm"
                const v = value.replace(' ', 'T');
                const m = v.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
                if (m) {
                  toFill = `${m[1]}T${m[2]}`;
                }
              }
              // 使用 fill('') 进行清空，兼容部分浏览器对 clear() 的限制
              await element.first().fill('');
              await element.first().fill(toFill);
            }

            this.log(`✅ 成功填写字段 ${fieldName} (使用选择器: ${selector})`);
            return;
          }
        } catch (error) {
          // 继续尝试下一个选择器
          // this.log(`  尝试选择器失败: ${selector}`);
        }
      }
    }

    // 如果所有选择器都失败,打印调试信息
    this.log(`❌ 所有选择器都失败,查找页面上的输入元素...`);
    const allInputs = await this.page.locator('input, textarea, select').all();
    this.log(`页面上共有 ${allInputs.length} 个输入元素`);

    for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
      const input = allInputs[i];
      const name = await input.getAttribute('name').catch(() => null);
      const id = await input.getAttribute('id').catch(() => null);
      const placeholder = await input.getAttribute('placeholder').catch(() => null);
      this.log(`  输入元素 ${i + 1}: name="${name}", id="${id}", placeholder="${placeholder}"`);
    }

    throw new Error(`找不到字段: ${fieldName}`);
  }

  /**
   * 日志输出
   */
  log(message: string, ...args: any[]): void {
    console.log(`[BDD] ${message}`, ...args);
  }

  /**
   * 错误日志
   */
  error(message: string, ...args: any[]): void {
    console.error(`[BDD ERROR] ${message}`, ...args);
  }
}

// 设置为Cucumber的World构造函数
setWorldConstructor(CustomWorld);

