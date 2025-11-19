import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS, SELECTORS } from '../fixtures/test-data';

/**
 * 页面对象模型基类
 */
export class BasePage {
  protected page: Page;
  protected baseURL: string;

  constructor(page: Page, baseURL: string = 'http://localhost:3000') {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * 导航到指定路径
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(`${this.baseURL}${path}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.navigation
    });
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 等待元素可见
   */
  async waitForElement(selector: string, timeout: number = TIMEOUTS.medium): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * 点击元素
   */
  async click(selector: string, timeout: number = TIMEOUTS.medium): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.click();
  }

  /**
   * 填写输入框
   */
  async fill(selector: string, value: string, timeout: number = TIMEOUTS.medium): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.fill(value);
  }

  /**
   * 选择下拉框选项
   */
  async selectOption(selector: string, value: string, timeout: number = TIMEOUTS.medium): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.selectOption(value);
  }

  /**
   * 获取文本内容
   */
  async getText(selector: string, timeout: number = TIMEOUTS.medium): Promise<string> {
    const element = await this.waitForElement(selector, timeout);
    return await element.textContent() || '';
  }

  /**
   * 检查元素是否可见
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      await element.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查元素是否存在
   */
  async isPresent(selector: string): Promise<boolean> {
    const count = await this.page.locator(selector).count();
    return count > 0;
  }

  /**
   * 等待并点击提交按钮
   */
  async submitForm(): Promise<void> {
    await this.click(SELECTORS.submitButton);
  }

  /**
   * 等待错误消息出现
   */
  async waitForErrorMessage(): Promise<string> {
    const errorElement = await this.waitForElement(SELECTORS.login.errorMessage);
    return await errorElement.textContent() || '';
  }

  /**
   * 检查页面标题
   */
  async checkPageTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * 检查URL路径
   */
  async checkCurrentPath(expectedPath: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }

  /**
   * 截图
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  /**
   * 等待网络请求完成
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 检查控制台错误
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  /**
   * 等待API响应
   */
  async waitForApiResponse(urlPattern: string, timeout: number = TIMEOUTS.medium): Promise<any> {
    const response = await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
    
    return await response.json();
  }

  /**
   * 模拟键盘按键
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * 滚动到元素
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * 等待元素消失
   */
  async waitForElementToDisappear(selector: string, timeout: number = TIMEOUTS.medium): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'hidden', timeout });
  }

  /**
   * 检查加载状态
   */
  async waitForLoadingToComplete(): Promise<void> {
    // 等待可能的加载指示器消失
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[aria-label="Loading"]'
    ];

    for (const selector of loadingSelectors) {
      if (await this.isVisible(selector)) {
        await this.waitForElementToDisappear(selector);
      }
    }
  }

  /**
   * 获取当前URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * 刷新页面
   */
  async refresh(): Promise<void> {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  /**
   * 返回上一页
   */
  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'networkidle' });
  }
}
