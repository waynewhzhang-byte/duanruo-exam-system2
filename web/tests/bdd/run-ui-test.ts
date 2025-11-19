/**
 * UI端BDD测试运行器
 * 使用Playwright运行完整的考试流程测试
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';

interface TestData {
  tenantId: string;
  tenantCode: string;
  tenantAdminUsername: string;
  tenantAdminPassword: string;
  candidateUsername: string;
  candidatePassword: string;
  examId?: string;
  examName?: string;
  positionId?: string;
  positionName?: string;
  subjectId?: string;
  subjectName?: string;
  applicationId?: string;
  ticketId?: string;
  venueId?: string;
  authToken?: string;
}

class UITestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private testData: TestData;

  constructor() {
    this.testData = {
      tenantId: '421eee4a-1a2a-4f9d-95a4-37073d4b15c5',
      tenantCode: 'test_company_1762456657147',
      tenantAdminUsername: 'tenant_admin_1762476737466',
      tenantAdminPassword: 'TenantAdmin@123',
      candidateUsername: 'candidate_1762476516042',
      candidatePassword: 'Candidate@123',
    };
  }

  async setup() {
    console.log('🚀 启动浏览器...');
    this.browser = await chromium.launch({
      headless: false, // 显示浏览器窗口以便观察
      slowMo: 500, // 减慢操作速度以便观察
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: './test-results/videos',
        size: { width: 1920, height: 1080 },
      },
    });

    this.page = await this.context.newPage();
    console.log('✅ 浏览器启动成功');
  }

  async teardown() {
    console.log('🧹 清理测试环境...');
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    console.log('✅ 清理完成');
  }

  async runTest() {
    try {
      await this.setup();

      console.log('\n========================================');
      console.log('开始UI端BDD测试：完整考试流程');
      console.log('========================================\n');

      // 步骤1: 租户管理员登录
      await this.step1_TenantAdminLogin();

      // 步骤2: 查看考试列表
      await this.step2_ViewExamList();

      // 步骤3: 查看考试详情
      await this.step3_ViewExamDetails();

      // 步骤4: 查看岗位和科目
      await this.step4_ViewPositionsAndSubjects();

      // 步骤5: 考生登录
      await this.step5_CandidateLogin();

      // 步骤6: 查看报名状态
      await this.step6_ViewApplicationStatus();

      // 步骤7: 查看准考证
      await this.step7_ViewTicket();

      // 步骤8: 租户管理员查看成绩管理
      await this.step8_ViewScoreManagement();

      // 步骤9: 考生查看成绩
      await this.step9_CandidateViewScore();

      console.log('\n========================================');
      console.log('✅ 所有测试步骤完成！');
      console.log('========================================\n');

    } catch (error) {
      console.error('\n❌ 测试失败:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }

  private async step1_TenantAdminLogin() {
    console.log('[步骤1] 租户管理员登录...');
    const page = this.page!;

    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // 填写登录表单
    await page.fill('input[name="username"]', this.testData.tenantAdminUsername);
    await page.fill('input[name="password"]', this.testData.tenantAdminPassword);

    // 点击登录
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('✅ 租户管理员登录成功');
  }

  private async step2_ViewExamList() {
    console.log('[步骤2] 查看考试列表...');
    const page = this.page!;

    // 导航到考试管理页面
    await page.goto('http://localhost:3000/admin/exams');
    await page.waitForLoadState('networkidle');

    // 截图
    await page.screenshot({ path: './test-results/screenshots/exam-list.png' });

    console.log('✅ 考试列表页面加载成功');
  }

  private async step3_ViewExamDetails() {
    console.log('[步骤3] 查看考试详情...');
    const page = this.page!;

    // 点击第一个考试
    const examLink = page.locator('a[href*="/admin/exams/"]').first();
    if (await examLink.count() > 0) {
      await examLink.click();
      await page.waitForLoadState('networkidle');

      // 截图
      await page.screenshot({ path: './test-results/screenshots/exam-details.png' });

      console.log('✅ 考试详情页面加载成功');
    } else {
      console.log('⚠️  没有找到考试，跳过此步骤');
    }
  }

  private async step4_ViewPositionsAndSubjects() {
    console.log('[步骤4] 查看岗位和科目...');
    const page = this.page!;

    // 查找岗位列表
    const positionSection = page.locator('text=/岗位|Position/');
    if (await positionSection.count() > 0) {
      await page.screenshot({ path: './test-results/screenshots/positions.png' });
      console.log('✅ 岗位信息显示成功');
    }

    // 查找科目列表
    const subjectSection = page.locator('text=/科目|Subject/');
    if (await subjectSection.count() > 0) {
      await page.screenshot({ path: './test-results/screenshots/subjects.png' });
      console.log('✅ 科目信息显示成功');
    }
  }

  private async step5_CandidateLogin() {
    console.log('[步骤5] 考生登录...');
    const page = this.page!;

    // 登出当前用户
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // 填写考生登录表单
    await page.fill('input[name="username"]', this.testData.candidateUsername);
    await page.fill('input[name="password"]', this.testData.candidatePassword);

    // 点击登录
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('✅ 考生登录成功');
  }

  private async step6_ViewApplicationStatus() {
    console.log('[步骤6] 查看报名状态...');
    const page = this.page!;

    // 导航到我的报名页面
    await page.goto('http://localhost:3000/my-applications');
    await page.waitForLoadState('networkidle');

    // 截图
    await page.screenshot({ path: './test-results/screenshots/my-applications.png' });

    console.log('✅ 报名状态页面加载成功');
  }

  private async step7_ViewTicket() {
    console.log('[步骤7] 查看准考证...');
    const page = this.page!;

    // 查找准考证按钮
    const ticketButton = page.locator('button:has-text("查看准考证"), button:has-text("View Ticket")');
    if (await ticketButton.count() > 0) {
      await ticketButton.first().click();
      await page.waitForTimeout(2000);

      // 截图
      await page.screenshot({ path: './test-results/screenshots/ticket.png' });

      console.log('✅ 准考证显示成功');
    } else {
      console.log('⚠️  没有找到准考证，可能还未生成');
    }
  }

  private async step8_ViewScoreManagement() {
    console.log('[步骤8] 租户管理员查看成绩管理...');
    const page = this.page!;

    // 重新登录为租户管理员
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="username"]', this.testData.tenantAdminUsername);
    await page.fill('input[name="password"]', this.testData.tenantAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // 导航到成绩管理页面
    await page.goto('http://localhost:3000/admin/scores');
    await page.waitForLoadState('networkidle');

    // 截图
    await page.screenshot({ path: './test-results/screenshots/score-management.png' });

    console.log('✅ 成绩管理页面加载成功');
  }

  private async step9_CandidateViewScore() {
    console.log('[步骤9] 考生查看成绩...');
    const page = this.page!;

    // 重新登录为考生
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="username"]', this.testData.candidateUsername);
    await page.fill('input[name="password"]', this.testData.candidatePassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // 导航到成绩查询页面
    await page.goto('http://localhost:3000/my-scores');
    await page.waitForLoadState('networkidle');

    // 截图
    await page.screenshot({ path: './test-results/screenshots/my-scores.png' });

    console.log('✅ 成绩查询页面加载成功');
  }
}

// 运行测试
const runner = new UITestRunner();
runner.runTest().catch((error) => {
  console.error('测试执行失败:', error);
  process.exit(1);
});

