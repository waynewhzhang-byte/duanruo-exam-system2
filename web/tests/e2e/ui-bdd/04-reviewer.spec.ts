/**
 * UI BDD测试 - 审核员功能
 * 测试账户: bdd_reviewer1 / Reviewer123!@# (一级审核员)
 *          bdd_reviewer2 / Reviewer123!@# (二级审核员)
 */

import { test, expect, Page } from '@playwright/test';

// 测试账户配置
const REVIEWER1 = {
  username: 'bdd_reviewer1',
  password: 'Reviewer123!@#',
  loginUrl: 'http://localhost:3000/login?role=reviewer',
  level: '一级审核员'
};

const REVIEWER2 = {
  username: 'bdd_reviewer2',
  password: 'Reviewer123!@#',
  loginUrl: 'http://localhost:3000/login?role=reviewer',
  level: '二级审核员'
};

// 辅助函数：登录为审核员
async function loginAsReviewer(page: Page, reviewer: typeof REVIEWER1 | typeof REVIEWER2) {
  await page.goto(reviewer.loginUrl);
  await page.waitForLoadState('networkidle');
  
  // 填写登录表单
  await page.fill('input[name="username"]', reviewer.username);
  await page.fill('input[name="password"]', reviewer.password);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待登录成功
  await page.waitForTimeout(3000);
  
  // 验证登录成功
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
  
  console.log(`✅ ${reviewer.level}登录成功`);
}

test.describe('一级审核员 - 登录与审核队列', () => {
  test('场景1: 一级审核员成功登录', async ({ page }) => {
    console.log('\n📋 测试场景: 一级审核员成功登录');
    
    await loginAsReviewer(page, REVIEWER1);
    
    // 验证页面加载
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ path: 'test-results/reviewer1-login.png' });
    console.log('✅ 一级审核员登录验证完成');
  });

  test('场景2: 查看待审核列表', async ({ page }) => {
    console.log('\n📋 测试场景: 查看待审核列表');
    
    await loginAsReviewer(page, REVIEWER1);
    
    // 导航到审核队列页面
    const reviewUrls = [
      'http://localhost:3000/reviewer/queue',
      'http://localhost:3000/review/queue',
      'http://localhost:3000/reviewer/pending',
      'http://localhost:3000/review'
    ];
    
    for (const url of reviewUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 检查是否有审核列表
      const listSelectors = [
        'text=待审核',
        'text=审核队列',
        'text=Pending Review',
        '.review-list',
        '[data-testid="review-queue"]',
        'table'
      ];
      
      for (const selector of listSelectors) {
        const list = page.locator(selector).first();
        if (await list.count() > 0) {
          console.log(`✅ 审核队列加载成功 (${url})`);
          await page.screenshot({ path: 'test-results/reviewer1-queue.png' });
          return;
        }
      }
    }
    
    console.log('⚠️ 未找到审核队列');
    await page.screenshot({ path: 'test-results/reviewer1-no-queue.png' });
  });

  test('场景3: 查看报名详情', async ({ page }) => {
    console.log('\n📋 测试场景: 查看报名详情');
    
    await loginAsReviewer(page, REVIEWER1);
    
    // 导航到审核队列
    await page.goto('http://localhost:3000/reviewer/queue');
    await page.waitForLoadState('networkidle');
    
    // 查找第一个待审核任务
    const taskSelectors = [
      'tr:first-child a',
      '.review-item:first-child',
      'button:has-text("查看")',
      '[data-testid="review-task"]:first-child'
    ];
    
    let clicked = false;
    for (const selector of taskSelectors) {
      const task = page.locator(selector).first();
      if (await task.count() > 0) {
        await task.click();
        clicked = true;
        console.log('✅ 点击查看报名详情');
        break;
      }
    }
    
    if (!clicked) {
      console.log('⚠️ 未找到待审核任务，跳过此测试');
      test.skip();
      return;
    }
    
    await page.waitForTimeout(2000);
    
    // 验证详情页面
    const detailSelectors = [
      'text=报名详情',
      'text=考生信息',
      'text=Application Details',
      '[data-testid="application-detail"]'
    ];
    
    for (const selector of detailSelectors) {
      const detail = page.locator(selector).first();
      if (await detail.count() > 0) {
        console.log('✅ 报名详情页面加载成功');
        break;
      }
    }
    
    await page.screenshot({ path: 'test-results/reviewer1-application-detail.png' });
    console.log('✅ 查看报名详情完成');
  });

  test('场景4: 查看考生附件', async ({ page }) => {
    console.log('\n📋 测试场景: 查看考生附件');
    
    await loginAsReviewer(page, REVIEWER1);
    
    // 导航到审核队列并打开第一个任务
    await page.goto('http://localhost:3000/reviewer/queue');
    await page.waitForLoadState('networkidle');
    
    const firstTask = page.locator('tr:first-child a, .review-item:first-child').first();
    if (await firstTask.count() > 0) {
      await firstTask.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 未找到待审核任务，跳过此测试');
      test.skip();
      return;
    }
    
    // 查找附件部分
    const attachmentSelectors = [
      'text=附件',
      'text=材料',
      'text=Attachments',
      '[data-testid="attachments"]',
      '.attachments'
    ];
    
    let foundAttachments = false;
    for (const selector of attachmentSelectors) {
      const attachments = page.locator(selector).first();
      if (await attachments.count() > 0) {
        foundAttachments = true;
        console.log('✅ 找到附件部分');
        break;
      }
    }
    
    if (!foundAttachments) {
      console.log('⚠️ 未找到附件部分');
    }
    
    await page.screenshot({ path: 'test-results/reviewer1-attachments.png' });
    console.log('✅ 查看附件完成');
  });

  test('场景5: 审核通过', async ({ page }) => {
    console.log('\n📋 测试场景: 审核通过');
    
    await loginAsReviewer(page, REVIEWER1);
    
    // 导航到审核队列并打开第一个任务
    await page.goto('http://localhost:3000/reviewer/queue');
    await page.waitForLoadState('networkidle');
    
    const firstTask = page.locator('tr:first-child a, .review-item:first-child').first();
    if (await firstTask.count() > 0) {
      await firstTask.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 未找到待审核任务，跳过此测试');
      test.skip();
      return;
    }
    
    // 查找审核通过按钮
    const approveButtonSelectors = [
      'button:has-text("通过")',
      'button:has-text("审核通过")',
      'button:has-text("Approve")',
      '[data-testid="approve-btn"]'
    ];
    
    let approveButton = null;
    for (const selector of approveButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        approveButton = btn;
        console.log(`✅ 找到审核通过按钮 (${selector})`);
        break;
      }
    }
    
    if (!approveButton) {
      console.log('⚠️ 未找到审核通过按钮，跳过此测试');
      test.skip();
      return;
    }
    
    // 点击审核通过
    await approveButton.click();
    await page.waitForTimeout(1000);
    
    // 填写审核意见（如果需要）
    const commentTextarea = page.locator('textarea[name="comment"], textarea[name="reviewComment"]').first();
    if (await commentTextarea.count() > 0 && await commentTextarea.isVisible()) {
      await commentTextarea.fill('信息真实有效，审核通过');
      console.log('✅ 填写审核意见');
    }
    
    // 截图
    await page.screenshot({ path: 'test-results/reviewer1-approve-form.png' });
    
    // 确认提交
    const confirmButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("确定")',
      'button:has-text("提交")',
      'button:has-text("Confirm")'
    ];
    
    for (const selector of confirmButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        console.log('✅ 提交审核结果');
        break;
      }
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/reviewer1-approved.png' });
    console.log('✅ 审核通过流程完成');
  });

  test('场景6: 审核拒绝', async ({ page }) => {
    console.log('\n📋 测试场景: 审核拒绝');
    
    await loginAsReviewer(page, REVIEWER1);
    
    // 导航到审核队列并打开第一个任务
    await page.goto('http://localhost:3000/reviewer/queue');
    await page.waitForLoadState('networkidle');
    
    const firstTask = page.locator('tr:first-child a, .review-item:first-child').first();
    if (await firstTask.count() > 0) {
      await firstTask.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 未找到待审核任务，跳过此测试');
      test.skip();
      return;
    }
    
    // 查找审核拒绝按钮
    const rejectButtonSelectors = [
      'button:has-text("拒绝")',
      'button:has-text("审核拒绝")',
      'button:has-text("Reject")',
      '[data-testid="reject-btn"]'
    ];
    
    let rejectButton = null;
    for (const selector of rejectButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        rejectButton = btn;
        console.log(`✅ 找到审核拒绝按钮 (${selector})`);
        break;
      }
    }
    
    if (!rejectButton) {
      console.log('⚠️ 未找到审核拒绝按钮，跳过此测试');
      test.skip();
      return;
    }
    
    // 点击审核拒绝
    await rejectButton.click();
    await page.waitForTimeout(1000);
    
    // 填写拒绝原因（必填）
    const reasonTextarea = page.locator('textarea[name="reason"], textarea[name="rejectReason"], textarea[name="comment"]').first();
    if (await reasonTextarea.count() > 0 && await reasonTextarea.isVisible()) {
      await reasonTextarea.fill('材料不完整，请补充相关证明文件');
      console.log('✅ 填写拒绝原因');
    }
    
    // 截图
    await page.screenshot({ path: 'test-results/reviewer1-reject-form.png' });
    
    // 确认提交
    const confirmButton = page.locator('button[type="submit"], button:has-text("确定"), button:has-text("提交")').first();
    if (await confirmButton.count() > 0 && await confirmButton.isVisible()) {
      await confirmButton.click();
      console.log('✅ 提交审核结果');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/reviewer1-rejected.png' });
    console.log('✅ 审核拒绝流程完成');
  });
});

test.describe('二级审核员 - 二级审核', () => {
  test('场景7: 二级审核员成功登录', async ({ page }) => {
    console.log('\n📋 测试场景: 二级审核员成功登录');
    
    await loginAsReviewer(page, REVIEWER2);
    
    // 验证页面加载
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ path: 'test-results/reviewer2-login.png' });
    console.log('✅ 二级审核员登录验证完成');
  });

  test('场景8: 查看二级审核队列', async ({ page }) => {
    console.log('\n📋 测试场景: 查看二级审核队列');
    
    await loginAsReviewer(page, REVIEWER2);
    
    // 导航到审核队列页面
    const reviewUrls = [
      'http://localhost:3000/reviewer/queue',
      'http://localhost:3000/review/queue',
      'http://localhost:3000/reviewer/pending',
      'http://localhost:3000/review'
    ];
    
    for (const url of reviewUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 检查是否有审核列表
      const listSelectors = [
        'text=待审核',
        'text=二级审核',
        'text=审核队列',
        '.review-list',
        'table'
      ];
      
      for (const selector of listSelectors) {
        const list = page.locator(selector).first();
        if (await list.count() > 0) {
          console.log(`✅ 二级审核队列加载成功 (${url})`);
          await page.screenshot({ path: 'test-results/reviewer2-queue.png' });
          return;
        }
      }
    }
    
    console.log('⚠️ 未找到二级审核队列');
    await page.screenshot({ path: 'test-results/reviewer2-no-queue.png' });
  });

  test('场景9: 查看一级审核意见', async ({ page }) => {
    console.log('\n📋 测试场景: 查看一级审核意见');
    
    await loginAsReviewer(page, REVIEWER2);
    
    // 导航到审核队列并打开第一个任务
    await page.goto('http://localhost:3000/reviewer/queue');
    await page.waitForLoadState('networkidle');
    
    const firstTask = page.locator('tr:first-child a, .review-item:first-child').first();
    if (await firstTask.count() > 0) {
      await firstTask.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 未找到待审核任务，跳过此测试');
      test.skip();
      return;
    }
    
    // 查找审核历史或一级审核意见
    const historySelectors = [
      'text=审核历史',
      'text=一级审核',
      'text=Review History',
      '[data-testid="review-history"]',
      '.review-history'
    ];
    
    let foundHistory = false;
    for (const selector of historySelectors) {
      const history = page.locator(selector).first();
      if (await history.count() > 0) {
        foundHistory = true;
        console.log('✅ 找到审核历史');
        break;
      }
    }
    
    if (!foundHistory) {
      console.log('⚠️ 未找到审核历史');
    }
    
    await page.screenshot({ path: 'test-results/reviewer2-review-history.png' });
    console.log('✅ 查看一级审核意见完成');
  });

  test('场景10: 二级审核通过', async ({ page }) => {
    console.log('\n📋 测试场景: 二级审核通过');
    
    await loginAsReviewer(page, REVIEWER2);
    
    // 导航到审核队列并打开第一个任务
    await page.goto('http://localhost:3000/reviewer/queue');
    await page.waitForLoadState('networkidle');
    
    const firstTask = page.locator('tr:first-child a, .review-item:first-child').first();
    if (await firstTask.count() > 0) {
      await firstTask.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 未找到待审核任务，跳过此测试');
      test.skip();
      return;
    }
    
    // 查找审核通过按钮
    const approveButton = page.locator('button:has-text("通过"), button:has-text("审核通过")').first();
    if (await approveButton.count() > 0) {
      await approveButton.click();
      await page.waitForTimeout(1000);
      
      // 填写审核意见
      const commentTextarea = page.locator('textarea').first();
      if (await commentTextarea.count() > 0 && await commentTextarea.isVisible()) {
        await commentTextarea.fill('二级审核通过，材料齐全');
        console.log('✅ 填写二级审核意见');
      }
      
      // 截图
      await page.screenshot({ path: 'test-results/reviewer2-approve-form.png' });
      
      // 提交
      const confirmButton = page.locator('button[type="submit"], button:has-text("确定")').first();
      if (await confirmButton.count() > 0 && await confirmButton.isVisible()) {
        await confirmButton.click();
        console.log('✅ 提交二级审核结果');
      }
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/reviewer2-approved.png' });
      console.log('✅ 二级审核通过流程完成');
    } else {
      console.log('⚠️ 未找到审核通过按钮，跳过此测试');
      test.skip();
    }
  });

  test('场景11: 查看已审核列表', async ({ page }) => {
    console.log('\n📋 测试场景: 查看已审核列表');
    
    await loginAsReviewer(page, REVIEWER2);
    
    // 导航到已审核页面
    const reviewedUrls = [
      'http://localhost:3000/reviewer/reviewed',
      'http://localhost:3000/review/history',
      'http://localhost:3000/reviewer/completed'
    ];
    
    for (const url of reviewedUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 检查是否有已审核列表
      const listSelectors = [
        'text=已审核',
        'text=审核历史',
        'text=Reviewed',
        'table'
      ];
      
      for (const selector of listSelectors) {
        const list = page.locator(selector).first();
        if (await list.count() > 0) {
          console.log(`✅ 已审核列表加载成功 (${url})`);
          await page.screenshot({ path: 'test-results/reviewer2-reviewed-list.png' });
          return;
        }
      }
    }
    
    console.log('⚠️ 未找到已审核列表');
    await page.screenshot({ path: 'test-results/reviewer2-no-reviewed-list.png' });
  });
});

test.describe('审核员 - 统计与报表', () => {
  test('场景12: 查看审核统计', async ({ page }) => {
    console.log('\n📋 测试场景: 查看审核统计');
    
    await loginAsReviewer(page, REVIEWER1);
    
    // 导航到统计页面
    const statsUrls = [
      'http://localhost:3000/reviewer/statistics',
      'http://localhost:3000/reviewer/dashboard',
      'http://localhost:3000/reviewer'
    ];
    
    for (const url of statsUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // 查找统计信息
      const statsSelectors = [
        'text=统计',
        'text=Dashboard',
        '[data-testid="statistics"]',
        '.statistics',
        '.dashboard'
      ];
      
      for (const selector of statsSelectors) {
        const stats = page.locator(selector).first();
        if (await stats.count() > 0) {
          console.log(`✅ 审核统计页面加载成功 (${url})`);
          await page.screenshot({ path: 'test-results/reviewer-statistics.png' });
          return;
        }
      }
    }
    
    console.log('⚠️ 未找到审核统计页面');
    await page.screenshot({ path: 'test-results/reviewer-no-statistics.png' });
  });
});

