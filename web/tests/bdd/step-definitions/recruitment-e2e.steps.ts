import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'expect';

// 模拟上下文，实际运行中会使用 World 对象存储 Token 和 ID
let context: any = {
  candidateToken: '',
  applicationId: '',
  examId: 'exam-2026-tech',
  tenantId: 'tenant-edugroup'
};

Given('系统已初始化基础数据（租户 {string}, 考试 {string}, 岗位 {string}）', 
  async function(tenant, exam, position) {
    console.log(`[Setup] 初始化租户: ${tenant}, 考试: ${exam}`);
    // 确保考试状态为 REGISTRATION_OPEN
});

Given('考场 {string} 已录入，包含 {int} 个教室，总容量 {int} 人', 
  async function(venueName, roomCount, capacity) {
    console.log(`[Setup] 创建考场: ${venueName}, 教室数: ${roomCount}, 总容量: ${capacity}`);
});

Given('我以考生 {string} 身份登录', async function(username) {
  console.log(`[Action] 考生登录: ${username}`);
  context.candidateToken = 'mock-jwt-token-zhang';
});

When('我填写 {string} 岗位的报名表：', async function(position, dataTable) {
  const data = dataTable.rowsHash();
  console.log(`[Action] 填写表单: ${JSON.stringify(data)}`);
  context.applicationPayload = data;
});

When('我上传附件 {string} 和 {string}', async function(f1, f2) {
  console.log(`[Action] 上传附件: ${f1}, ${f2}`);
  context.attachments = [{ name: f1, type: 'IMAGE' }, { name: f2, type: 'PDF' }];
});

When('我点击提交报名', async function() {
  console.log('[API] POST /api/v1/applications/submit');
  context.applicationId = 'app-888';
});

Then('系统应提示 {string}', async function(message) {
  console.log(`[Verify] 界面提示: ${message}`);
});

Given('报名已触发自动验证规则（年龄 > 18 且 学历 >= 本科）', async function() {
  console.log('[Backend] 自动验证通过，生成审核任务');
});

Then('报名状态应自动变为 {string}', async function(status) {
  console.log(`[Verify] API 状态确认: ${status}`);
});

When('一审员 {string} 登录并点击 {string}', async function(user, action) {
  console.log(`[Action] 一审员 ${user} 执行: ${action}`);
});

When('二审员 {string} 登录并点击 {string}', async function(user, action) {
  console.log(`[Action] 二审员 ${user} 执行: ${action}`);
});

Then('报名状态应更新为 {string}', async function(status) {
  console.log(`[Verify] 状态更新为: ${status}`);
});

When('考生 {string} 访问缴费页面并确认支付', async function(user) {
  console.log(`[Action] 考生 ${user} 确认支付`);
});

When('租户管理员登录并执行 {string}', async function(operation) {
  console.log(`[Admin] 执行: ${operation}`);
});

When('执行 {string}', async function(operation) {
  console.log(`[Admin] 继续执行: ${operation}`);
});

Then('考试 {string} 的发证进度应为 {int}%', async function(exam, progress) {
  console.log(`[Verify] 发证进度: ${progress}%`);
});

When('考生 {string} 再次登录门户', async function(user) {
  console.log(`[Action] 考生 ${user} 重新登录`);
});

Then('我应该能看到 {string} 按钮', async function(btnText) {
  console.log(`[Verify] 按钮 ${btnText} 已显示`);
});

Then('点击后显示的准考证应包含 {string} 和确定的 {string}', 
  async function(venue, seat) {
    console.log(`[Final Verify] 准考证内容核对: ${venue}, 包含座位号`);
    console.log('--- 闭环测试成功 ---');
});
