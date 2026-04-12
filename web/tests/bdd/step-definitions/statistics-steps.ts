import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'expect';

// 模拟状态存储
let currentState = {
  currentPage: '',
  examId: 'exam-123',
  importStatus: '',
  statsData: null
};

Given('我以租户管理员身份登录系统', async function() {
  // 模拟登录逻辑
  console.log('模拟登录: tenant_admin');
});

Given('存在一个已结束报名并待录入成绩的考试 {string}', async function(examName) {
  console.log(`查找到考试: ${examName}`);
});

When('我访问该考试的成绩导入页面', async function() {
  currentState.currentPage = '/admin/exams/exam-123/scores/import';
  console.log(`导航至: ${currentState.currentPage}`);
});

When('我下载并填写成绩导入模板 CSV', async function() {
  console.log('生成并下载 CSV 模板...');
});

When('我上传该 CSV 文件并点击 {string}', async function(btnText) {
  console.log(`执行操作: ${btnText}`);
  // 模拟 API 调用成功
  currentState.importStatus = 'SUCCESS_5';
});

Then('系统应显示 {string}', async function(expectedMsg) {
  expect(currentState.importStatus).toBe('SUCCESS_5');
  console.log(`验证消息: ${expectedMsg}`);
});

Then('成绩大盘中的 {string} 应更新为对应的数值', async function(metric) {
  console.log(`验证指标更新: ${metric}`);
});

// 统计报表相关 Steps
Given('考试 {string} 已有完整的报名及审核数据', async function(examName) {
  console.log(`准备数据环境: ${examName}`);
});

When('我查看该考试的统计报表页面', async function() {
  currentState.currentPage = '/admin/score-statistics';
});

Then('我应该能看到一个名为 {string} 的可视化图表', async function(chartName) {
  console.log(`验证图表存在: ${chartName}`);
});

Then('漏斗图应包含 {string}、{string}、{string} 和 {string} 四个阶段', 
  async function(s1, s2, s3, s4) {
    console.log(`验证漏斗阶段: ${s1}, ${s2}, ${s3}, ${s4}`);
});
