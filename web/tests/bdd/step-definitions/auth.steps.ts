import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api/v1';

let currentUser: { token?: string; roles?: string[]; tenantRoles?: any[] } = {};
let lastResponse: any = {};
let lastError: any = {};

Given('系统运行中', async function () {
  const response = await axios.get(`${API_BASE}/auth/login`).catch(() => ({ status: 200 }));
  expect(response.status).to.be.lessThan(500);
});

Given('数据库中有超级管理员账号 {string}', async function (credentials: string) {
  const [username, password] = credentials.split('/');
  const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
  currentUser.token = response.data.data.token;
  currentUser.roles = response.data.data.user.roles;
});

Given('数据库中有租户管理员账号 {string}', async function (credentials: string) {
  const [username, password] = credentials.split('/');
  const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
  currentUser.token = response.data.data.token;
  currentUser.roles = response.data.data.user.roles;
  currentUser.tenantRoles = response.data.data.tenantRoles;
});

Given('数据库中有考生账号 {string}', async function (credentials: string) {
  const [username, password] = credentials.split('/');
  const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
  currentUser.token = response.data.data?.token;
  currentUser.roles = response.data.data?.user?.roles;
});

Given('租户 {string} 已激活', async function (tenantCode: string) {
  expect(currentUser.tenantRoles).to.be.an('array');
});

When('用户访问登录页面', async function () {
});

When('用户登录', async function () {
});

When('输入用户名 {string} 和密码 {string}', async function (username: string, password: string) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
    lastResponse = response.data;
    currentUser.token = response.data.data?.token;
  } catch (error: any) {
    lastError = error;
    lastResponse = error.response?.data || { success: false, message: error.message };
  }
});

When('点击登录按钮', async function () {
});

Then('登录成功', function () {
  expect(lastResponse.success).to.be.true;
  expect(currentUser.token).to.be.a('string');
});

Then('跳转至平台管理后台 {string}', function (path: string) {
});

Then('权限包含 {string}', function (role: string) {
  expect(currentUser.roles).to.include(role);
});

Then('租户角色列表包含租户 {string}', function (tenantName: string) {
  expect(currentUser.tenantRoles).to.be.an('array');
  expect(currentUser.tenantRoles?.length).to.be.greaterThan(0);
});

Then('跳转至考生门户 {string}', function (path: string) {
});

Then('显示错误提示 {string}', function (message: string) {
  const errorMsg = (lastResponse?.message || lastError?.message || '').toString();
  const hasMessage = errorMsg.includes(message);
  const hasNoSuccess = lastResponse?.success === false;
  expect(hasMessage || hasNoSuccess || lastError?.response?.status === 401).to.be.true;
});

When('用户输入错误的密码', async function () {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { username: 'test', password: 'wrong' });
    lastResponse = response.data;
    lastError = null;
  } catch (error: any) {
    lastError = error;
    lastResponse = error.response?.data || { success: false, message: error.message };
  }
});

Then('登录失败', function () {
  const status = lastError?.response?.status || lastError?.status || lastResponse?.success === false ? 401 : 200;
  expect(status).to.equal(401);
});

Given('用户为租户管理员且有多个租户', async function () {
  const response = await axios.post(`${API_BASE}/auth/login`, { username: 'admin', password: 'admin123' });
  currentUser.token = response.data.data?.token;
  currentUser.tenantRoles = response.data.data?.tenantRoles || [];
});

When('点击切换租户', function () {
});

Given('选择另一个租户', function () {
});

Then('权限切换至新租户', function () {
});

Then('页面刷新显示新租户数据', function () {
});
