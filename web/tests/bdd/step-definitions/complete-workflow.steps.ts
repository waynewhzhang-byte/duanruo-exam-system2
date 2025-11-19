/**
 * 完整考试流程步骤定义
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

/**
 * 背景步骤
 */
Given('系统已经初始化', async function (this: CustomWorld) {
  this.log('验证系统已初始化');
  // 系统应该已经启动并可访问
  const page = this.page!;
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/考试报名系统|Exam Registration/);
});

Given('存在超级管理员账户', async function (this: CustomWorld) {
  this.log('验证超级管理员账户存在');
  this.testData.superAdminUsername = 'super_admin_1762456657147';
  this.testData.superAdminPassword = 'SuperAdmin@123';
});

Given('存在测试租户 {string}', async function (this: CustomWorld, tenantCode: string) {
  this.log(`验证租户存在: ${tenantCode}`);
  this.testData.tenantCode = tenantCode;
  this.testData.tenantId = '421eee4a-1a2a-4f9d-95a4-37073d4b15c5';
});

Given('存在租户管理员账户 {string}', async function (this: CustomWorld, username: string) {
  this.log(`验证租户管理员账户存在: ${username}`);
  this.testData.tenantAdminUsername = username;
  this.testData.tenantAdminPassword = 'TenantAdmin@123';
});

Given('存在考生账户 {string}', async function (this: CustomWorld, username: string) {
  this.log(`验证考生账户存在: ${username}`);
  this.testData.candidateUsername = username;
  this.testData.candidatePassword = 'Candidate@123';
});

/**
 * 登录步骤
 */
When('租户管理员使用用户名 {string} 和密码 {string} 登录', async function (
  this: CustomWorld,
  username: string,
  password: string
) {
  this.log(`租户管理员登录: ${username}`);
  const page = this.page!;

  // 访问登录页面
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // 填写登录表单
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待登录成功
  await page.waitForURL(/\/admin|\/tenant/, { timeout: 10000 });
  
  // 保存token
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (token) {
    this.testData.authToken = token;
  }
});

When('考生使用用户名 {string} 和密码 {string} 登录', async function (
  this: CustomWorld,
  username: string,
  password: string
) {
  this.log(`考生登录: ${username}`);
  const page = this.page!;

  // 访问登录页面
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // 填写登录表单
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待登录成功
  await page.waitForURL(/\/candidate|\/my-applications/, { timeout: 10000 });
  
  // 保存token
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (token) {
    this.testData.authToken = token;
  }
});

Then('应该看到租户管理员仪表板', async function (this: CustomWorld) {
  this.log('验证租户管理员仪表板');
  const page = this.page!;
  
  // 验证URL包含admin
  await expect(page).toHaveURL(/\/admin/);
  
  // 验证页面包含管理员相关元素
  await expect(page.locator('text=考试管理|Exam Management')).toBeVisible({ timeout: 5000 });
});

/**
 * 考试管理步骤
 */
When('租户管理员访问考试管理页面', async function (this: CustomWorld) {
  this.log('访问考试管理页面');
  const page = this.page!;
  
  // 点击考试管理菜单
  await page.click('text=考试管理');
  await page.waitForLoadState('networkidle');
  
  // 验证在考试列表页面
  await expect(page).toHaveURL(/\/admin\/exams/);
});

When('点击"创建考试"按钮', async function (this: CustomWorld) {
  this.log('点击创建考试按钮');
  const page = this.page!;
  
  // 点击创建按钮
  await page.click('button:has-text("创建考试"), button:has-text("Create Exam")');
  await page.waitForLoadState('networkidle');
});

When('填写考试信息:', async function (this: CustomWorld, dataTable) {
  this.log('填写考试信息');
  const page = this.page!;
  const data = dataTable.rowsHash();
  
  // 填写表单字段
  if (data['考试名称']) {
    await page.fill('input[name="examName"], input[name="name"]', data['考试名称']);
    this.testData.examName = data['考试名称'];
  }
  
  if (data['考试代码']) {
    await page.fill('input[name="examCode"], input[name="code"]', data['考试代码']);
  }

  if (data['报名开始']) {
    await page.fill('input[name="registrationStart"]', data['报名开始']);
  }

  if (data['报名结束']) {
    await page.fill('input[name="registrationEnd"]', data['报名结束']);
  }

  if (data['考试开始']) {
    await page.fill('input[name="examStart"]', data['考试开始']);
  }

  if (data['考试结束']) {
    await page.fill('input[name="examEnd"]', data['考试结束']);
  }

  if (data['是否收费']) {
    const isFree = data['是否收费'] === '否';
    if (isFree) {
      await page.check('input[name="isFree"]');
    }
  }

  if (data['报名费用']) {
    await page.fill('input[name="feeAmount"], input[name="fee"]', data['报名费用']);
  }
});

When('点击"保存"按钮', async function (this: CustomWorld) {
  this.log('点击保存按钮');
  const page = this.page!;

  await page.click('button:has-text("保存"), button:has-text("Save")');
  await page.waitForLoadState('networkidle');
});

Then('应该看到成功消息 {string}', async function (this: CustomWorld, message: string) {
  this.log(`验证成功消息: ${message}`);
  const page = this.page!;

  // 查找成功消息（可能在toast、alert或其他位置）
  const successLocator = page.locator(`text=${message}`).or(
    page.locator('.toast:has-text("成功")').or(
      page.locator('.alert-success')
    )
  );

  await expect(successLocator.first()).toBeVisible({ timeout: 5000 });
});

/**
 * 岗位管理步骤
 */
When('租户管理员在考试详情页面点击"添加岗位"', async function (this: CustomWorld) {
  this.log('点击添加岗位按钮');
  const page = this.page!;

  await page.click('button:has-text("添加岗位"), button:has-text("Add Position")');
  await page.waitForLoadState('networkidle');
});

When('填写岗位信息:', async function (this: CustomWorld, dataTable) {
  this.log('填写岗位信息');
  const page = this.page!;
  const data = dataTable.rowsHash();

  if (data['岗位名称']) {
    await page.fill('input[name="positionName"], input[name="name"]', data['岗位名称']);
    this.testData.positionName = data['岗位名称'];
  }

  if (data['岗位代码']) {
    await page.fill('input[name="positionCode"], input[name="code"]', data['岗位代码']);
  }

  if (data['招聘人数']) {
    await page.fill('input[name="maxApplicants"], input[name="quota"]', data['招聘人数']);
  }
});

When('点击"保存岗位"按钮', async function (this: CustomWorld) {
  this.log('点击保存岗位按钮');
  const page = this.page!;

  await page.click('button:has-text("保存岗位"), button:has-text("Save Position")');
  await page.waitForLoadState('networkidle');
});

Then('应该看到岗位列表中包含 {string}', async function (this: CustomWorld, positionName: string) {
  this.log(`验证岗位列表包含: ${positionName}`);
  const page = this.page!;

  await expect(page.locator(`text=${positionName}`)).toBeVisible({ timeout: 5000 });
});

/**
 * 科目管理步骤
 */
When('租户管理员在岗位详情页面点击"添加科目"', async function (this: CustomWorld) {
  this.log('点击添加科目按钮');
  const page = this.page!;

  await page.click('button:has-text("添加科目"), button:has-text("Add Subject")');
  await page.waitForLoadState('networkidle');
});

When('填写科目信息:', async function (this: CustomWorld, dataTable) {
  this.log('填写科目信息');
  const page = this.page!;
  const data = dataTable.rowsHash();

  if (data['科目名称']) {
    await page.fill('input[name="subjectName"], input[name="name"]', data['科目名称']);
    this.testData.subjectName = data['科目名称'];
  }

  if (data['科目代码']) {
    await page.fill('input[name="subjectCode"], input[name="code"]', data['科目代码']);
  }

  if (data['总分']) {
    await page.fill('input[name="totalScore"], input[name="score"]', data['总分']);
  }
});

When('点击"保存科目"按钮', async function (this: CustomWorld) {
  this.log('点击保存科目按钮');
  const page = this.page!;

  await page.click('button:has-text("保存科目"), button:has-text("Save Subject")');
  await page.waitForLoadState('networkidle');
});

Then('应该看到科目列表中包含 {string}', async function (this: CustomWorld, subjectName: string) {
  this.log(`验证科目列表包含: ${subjectName}`);
  const page = this.page!;

  await expect(page.locator(`text=${subjectName}`)).toBeVisible({ timeout: 5000 });
});

/**
 * 审核员管理步骤
 */
When('租户管理员访问审核员管理页面', async function (this: CustomWorld) {
  this.log('访问审核员管理页面');
  const page = this.page!;

  await page.click('text=审核员管理');
  await page.waitForLoadState('networkidle');
});

When('为考试分配一级审核员', async function (this: CustomWorld) {
  this.log('分配一级审核员');
  const page = this.page!;

  await page.click('button:has-text("添加一级审核员")');
  await page.waitForSelector('select[name="reviewer"]');
  await page.selectOption('select[name="reviewer"]', { index: 1 });
  await page.click('button:has-text("确认")');
  await page.waitForLoadState('networkidle');
});

When('为考试分配二级审核员', async function (this: CustomWorld) {
  this.log('分配二级审核员');
  const page = this.page!;

  await page.click('button:has-text("添加二级审核员")');
  await page.waitForSelector('select[name="reviewer"]');
  await page.selectOption('select[name="reviewer"]', { index: 1 });
  await page.click('button:has-text("确认")');
  await page.waitForLoadState('networkidle');
});

Then('应该看到审核员配置成功', async function (this: CustomWorld) {
  this.log('验证审核员配置成功');
  const page = this.page!;

  await expect(page.locator('text=审核员配置成功')).toBeVisible({ timeout: 5000 });
});

/**
 * 考生报名步骤
 */
When('访问考试列表页面', async function (this: CustomWorld) {
  this.log('访问考试列表页面');
  const page = this.page!;

  await page.goto('http://localhost:3000/exams');
  await page.waitForLoadState('networkidle');
});

When('点击考试 {string}', async function (this: CustomWorld, examName: string) {
  this.log(`点击考试: ${examName}`);
  const page = this.page!;

  await page.click(`text=${examName}`);
  await page.waitForLoadState('networkidle');
});

When('点击"立即报名"按钮', async function (this: CustomWorld) {
  this.log('点击立即报名按钮');
  const page = this.page!;

  await page.click('button:has-text("立即报名"), button:has-text("Apply Now")');
  await page.waitForLoadState('networkidle');
});

When('选择岗位 {string}', async function (this: CustomWorld, positionName: string) {
  this.log(`选择岗位: ${positionName}`);
  const page = this.page!;

  await page.click(`text=${positionName}`);
  await page.waitForLoadState('networkidle');
});

When('填写报名表单', async function (this: CustomWorld) {
  this.log('填写报名表单');
  const page = this.page!;

  // 填写基本信息（根据实际表单字段调整）
  const formFields = await page.locator('input[type="text"], textarea').all();
  for (const field of formFields) {
    const name = await field.getAttribute('name');
    if (name && !name.includes('file')) {
      await field.fill('测试数据');
    }
  }
});

When('上传身份证照片', async function (this: CustomWorld) {
  this.log('上传身份证照片');
  const page = this.page!;

  // 模拟文件上传
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: 'id-card.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake-image-data')
  });
});

When('上传学历证明', async function (this: CustomWorld) {
  this.log('上传学历证明');
  const page = this.page!;

  // 模拟文件上传
  const fileInput = page.locator('input[type="file"]').nth(1);
  await fileInput.setInputFiles({
    name: 'diploma.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('fake-pdf-data')
  });
});

When('点击"提交报名"按钮', async function (this: CustomWorld) {
  this.log('点击提交报名按钮');
  const page = this.page!;

  await page.click('button:has-text("提交报名"), button:has-text("Submit")');
  await page.waitForLoadState('networkidle');
});

/**
 * 审核步骤
 */
When('一级审核员登录系统', async function (this: CustomWorld) {
  this.log('一级审核员登录');
  const page = this.page!;

  // 先登出当前用户
  await page.goto('http://localhost:3000/login');

  // 登录一级审核员
  await page.fill('input[name="username"]', 'primary_reviewer_1762476737466');
  await page.fill('input[name="password"]', 'Reviewer@123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
});

When('二级审核员登录系统', async function (this: CustomWorld) {
  this.log('二级审核员登录');
  const page = this.page!;

  // 先登出当前用户
  await page.goto('http://localhost:3000/login');

  // 登录二级审核员
  await page.fill('input[name="username"]', 'secondary_reviewer_1762476737466');
  await page.fill('input[name="password"]', 'Reviewer@123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
});

When('访问待审核列表', async function (this: CustomWorld) {
  this.log('访问待审核列表');
  const page = this.page!;

  await page.click('text=待审核');
  await page.waitForLoadState('networkidle');
});

When('点击第一条报名记录', async function (this: CustomWorld) {
  this.log('点击第一条报名记录');
  const page = this.page!;

  await page.locator('tr').nth(1).click();
  await page.waitForLoadState('networkidle');
});

When('查看报名详情和附件', async function (this: CustomWorld) {
  this.log('查看报名详情和附件');
  const page = this.page!;

  // 验证能看到报名详情
  await expect(page.locator('text=报名详情')).toBeVisible({ timeout: 5000 });
});

When('点击"审核通过"按钮', async function (this: CustomWorld) {
  this.log('点击审核通过按钮');
  const page = this.page!;

  await page.click('button:has-text("审核通过"), button:has-text("Approve")');
  await page.waitForLoadState('networkidle');
});

/**
 * 支付步骤
 */
When('考生查看报名状态', async function (this: CustomWorld) {
  this.log('查看报名状态');
  const page = this.page!;

  await page.goto('http://localhost:3000/my-applications');
  await page.waitForLoadState('networkidle');
});

Then('应该看到状态为 {string}', async function (this: CustomWorld, status: string) {
  this.log(`验证状态: ${status}`);
  const page = this.page!;

  await expect(page.locator(`text=${status}`)).toBeVisible({ timeout: 5000 });
});

When('系统模拟支付完成', async function (this: CustomWorld) {
  this.log('模拟支付完成');
  // 通过API直接更新支付状态
  const applicationId = this.testData.applicationId;

  // 调用后端API更新状态
  await this.page!.evaluate(async (appId) => {
    const response = await fetch(`http://localhost:8081/api/v1/applications/${appId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-Tenant-Id': localStorage.getItem('tenantId')
      },
      body: JSON.stringify({ status: 'PAID' })
    });
    return response.json();
  }, applicationId);
});

Then('报名状态应该更新为 {string}', async function (this: CustomWorld, status: string) {
  this.log(`验证状态更新为: ${status}`);
  const page = this.page!;

  await page.reload();
  await expect(page.locator(`text=${status}`)).toBeVisible({ timeout: 5000 });
});

/**
 * 准考证步骤
 */
When('系统自动生成准考证', async function (this: CustomWorld) {
  this.log('系统自动生成准考证');
  // 准考证在支付完成后自动生成
  await this.page!.waitForTimeout(2000);
});

Then('考生应该能够下载准考证', async function (this: CustomWorld) {
  this.log('验证能够下载准考证');
  const page = this.page!;

  await expect(page.locator('button:has-text("下载准考证"), a:has-text("Download Ticket")')).toBeVisible({ timeout: 5000 });
});

Then('准考证应该包含准考证号', async function (this: CustomWorld) {
  this.log('验证准考证包含准考证号');
  const page = this.page!;

  // 点击查看准考证
  await page.click('button:has-text("查看准考证"), button:has-text("View Ticket")');
  await page.waitForLoadState('networkidle');

  // 验证准考证号存在
  await expect(page.locator('text=/准考证号|Ticket No/')).toBeVisible({ timeout: 5000 });
});

/**
 * 考场管理步骤
 */
When('租户管理员访问考场管理页面', async function (this: CustomWorld) {
  this.log('访问考场管理页面');
  const page = this.page!;

  await page.click('text=考场管理');
  await page.waitForLoadState('networkidle');
});

When('点击"创建考场"按钮', async function (this: CustomWorld) {
  this.log('点击创建考场按钮');
  const page = this.page!;

  await page.click('button:has-text("创建考场"), button:has-text("Create Venue")');
  await page.waitForLoadState('networkidle');
});

When('填写考场信息:', async function (this: CustomWorld, dataTable) {
  this.log('填写考场信息');
  const page = this.page!;
  const data = dataTable.rowsHash();

  if (data['考场名称']) {
    await page.fill('input[name="venueName"], input[name="name"]', data['考场名称']);
  }

  if (data['地址']) {
    await page.fill('input[name="address"]', data['地址']);
  }

  if (data['容量']) {
    await page.fill('input[name="capacity"]', data['容量']);
  }
});

/**
 * 关闭报名步骤
 */
When('租户管理员访问考试详情页面', async function (this: CustomWorld) {
  this.log('访问考试详情页面');
  const page = this.page!;

  // 假设已经在考试列表页面
  await page.click(`text=${this.testData.examName}`);
  await page.waitForLoadState('networkidle');
});

When('点击"关闭报名"按钮', async function (this: CustomWorld) {
  this.log('点击关闭报名按钮');
  const page = this.page!;

  await page.click('button:has-text("关闭报名"), button:has-text("Close Registration")');
  await page.waitForLoadState('networkidle');
});

When('确认关闭操作', async function (this: CustomWorld) {
  this.log('确认关闭操作');
  const page = this.page!;

  await page.click('button:has-text("确认"), button:has-text("Confirm")');
  await page.waitForLoadState('networkidle');
});

Then('考试状态应该更新为 {string}', async function (this: CustomWorld, status: string) {
  this.log(`验证考试状态: ${status}`);
  const page = this.page!;

  await expect(page.locator(`text=${status}`)).toBeVisible({ timeout: 5000 });
});

/**
 * 座位分配步骤
 */
When('租户管理员访问座位管理页面', async function (this: CustomWorld) {
  this.log('访问座位管理页面');
  const page = this.page!;

  await page.click('text=座位管理');
  await page.waitForLoadState('networkidle');
});

When('点击"自动分配座位"按钮', async function (this: CustomWorld) {
  this.log('点击自动分配座位按钮');
  const page = this.page!;

  await page.click('button:has-text("自动分配座位"), button:has-text("Auto Assign Seats")');
  await page.waitForLoadState('networkidle');
});

When('选择分配策略 {string}', async function (this: CustomWorld, strategy: string) {
  this.log(`选择分配策略: ${strategy}`);
  const page = this.page!;

  await page.selectOption('select[name="strategy"]', { label: strategy });
});

When('点击"开始分配"按钮', async function (this: CustomWorld) {
  this.log('点击开始分配按钮');
  const page = this.page!;

  await page.click('button:has-text("开始分配"), button:has-text("Start Assignment")');
  await page.waitForLoadState('networkidle');
});

Then('应该看到分配统计信息', async function (this: CustomWorld) {
  this.log('验证分配统计信息');
  const page = this.page!;

  await expect(page.locator('text=/已分配|Assigned/')).toBeVisible({ timeout: 5000 });
});

/**
 * 准考证查看步骤（包含座位信息）
 */
When('考生重新下载准考证', async function (this: CustomWorld) {
  this.log('重新下载准考证');
  const page = this.page!;

  await page.goto('http://localhost:3000/my-applications');
  await page.waitForLoadState('networkidle');

  // 点击查看准考证
  await page.click('button:has-text("查看准考证"), button:has-text("View Ticket")');
  await page.waitForLoadState('networkidle');
});

Then('准考证应该包含考场信息', async function (this: CustomWorld) {
  this.log('验证准考证包含考场信息');
  const page = this.page!;

  await expect(page.locator('text=/考场|Venue/')).toBeVisible({ timeout: 5000 });
});

Then('准考证应该包含教室号', async function (this: CustomWorld) {
  this.log('验证准考证包含教室号');
  const page = this.page!;

  await expect(page.locator('text=/教室|Room/')).toBeVisible({ timeout: 5000 });
});

Then('准考证应该包含座位号', async function (this: CustomWorld) {
  this.log('验证准考证包含座位号');
  const page = this.page!;

  await expect(page.locator('text=/座位|Seat/')).toBeVisible({ timeout: 5000 });
});

/**
 * 成绩录入步骤
 */
When('租户管理员访问成绩管理页面', async function (this: CustomWorld) {
  this.log('访问成绩管理页面');
  const page = this.page!;

  await page.click('text=成绩管理');
  await page.waitForLoadState('networkidle');
});

When('选择考试 {string}', async function (this: CustomWorld, examName: string) {
  this.log(`选择考试: ${examName}`);
  const page = this.page!;

  await page.selectOption('select[name="exam"]', { label: examName });
  await page.waitForLoadState('networkidle');
});

When('选择科目 {string}', async function (this: CustomWorld, subjectName: string) {
  this.log(`选择科目: ${subjectName}`);
  const page = this.page!;

  await page.selectOption('select[name="subject"]', { label: subjectName });
  await page.waitForLoadState('networkidle');
});

When('为考生录入成绩 {string}', async function (this: CustomWorld, score: string) {
  this.log(`录入成绩: ${score}`);
  const page = this.page!;

  // 找到第一个成绩输入框
  await page.fill('input[name="score"]', score);
  this.testData.score = score;
});

When('添加备注 {string}', async function (this: CustomWorld, remarks: string) {
  this.log(`添加备注: ${remarks}`);
  const page = this.page!;

  await page.fill('textarea[name="remarks"], input[name="remarks"]', remarks);
});

When('点击"保存成绩"按钮', async function (this: CustomWorld) {
  this.log('点击保存成绩按钮');
  const page = this.page!;

  await page.click('button:has-text("保存成绩"), button:has-text("Save Score")');
  await page.waitForLoadState('networkidle');
});

/**
 * 成绩查询步骤
 */
When('租户管理员访问成绩查询页面', async function (this: CustomWorld) {
  this.log('访问成绩查询页面');
  const page = this.page!;

  await page.click('text=成绩查询');
  await page.waitForLoadState('networkidle');
});

When('搜索考生报名记录', async function (this: CustomWorld) {
  this.log('搜索考生报名记录');
  const page = this.page!;

  // 输入考生姓名或准考证号搜索
  await page.fill('input[name="search"]', this.testData.candidateUsername);
  await page.click('button:has-text("搜索"), button:has-text("Search")');
  await page.waitForLoadState('networkidle');
});

Then('应该看到考生成绩为 {string}', async function (this: CustomWorld, score: string) {
  this.log(`验证考生成绩: ${score}`);
  const page = this.page!;

  await expect(page.locator(`text=${score}`)).toBeVisible({ timeout: 5000 });
});

Then('应该看到备注 {string}', async function (this: CustomWorld, remarks: string) {
  this.log(`验证备注: ${remarks}`);
  const page = this.page!;

  await expect(page.locator(`text=${remarks}`)).toBeVisible({ timeout: 5000 });
});

/**
 * 考生成绩查询步骤
 */
When('考生访问成绩查询页面', async function (this: CustomWorld) {
  this.log('考生访问成绩查询页面');
  const page = this.page!;

  await page.goto('http://localhost:3000/my-scores');
  await page.waitForLoadState('networkidle');
});

Then('应该看到科目 {string} 的成绩为 {string}', async function (
  this: CustomWorld,
  subjectName: string,
  score: string
) {
  this.log(`验证科目 ${subjectName} 成绩: ${score}`);
  const page = this.page!;

  // 查找包含科目名称和成绩的行
  const row = page.locator(`tr:has-text("${subjectName}")`);
  await expect(row).toContainText(score);
});

Then('应该看到总分 {string}', async function (this: CustomWorld, totalScore: string) {
  this.log(`验证总分: ${totalScore}`);
  const page = this.page!;

  await expect(page.locator(`text=/总分.*${totalScore}|Total.*${totalScore}/`)).toBeVisible({ timeout: 5000 });
});

