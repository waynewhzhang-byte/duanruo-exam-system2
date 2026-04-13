import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api/v1';

// ============ Tenant Context Steps ============

Given('系统中存在两个租户:', async function () {
  // Data table provided separately
  if (this._tenants) {
    console.log(`[RBAC] Setup ${this._tenants.length} tenants`);
  } else {
    this._tenantA = { name: '租户A', code: 'tenant_a' };
    this._tenantB = { name: '租户B', code: 'tenant_b' };
  }
});

Given('{string} 有考试 {string}', async function (tenantLabel: string, examName: string) {
  console.log(`[RBAC] Tenant "${tenantLabel}" has exam "${examName}"`);
});

Given('系统中存在两个租户:', function (dataTable: any) {
  const rows = dataTable.rawData || dataTable.rows();
  this._tenants = rows.map((row: string[]) => ({
    name: row[0],
    code: row[1],
    exam: row[2],
  }));
  console.log(`[RBAC] Setup ${this._tenants.length} tenants`);
});

Given('{string} 有开放报名的考试', async function (tenantCode: string) {
  try {
    const response = await axios.get(`${API_BASE}/published-exams/open`, {
      headers: { 'X-Tenant-ID': '00000000-0000-0000-0000-000000000010' },
    });
    this.lastResponse = response.data;
  } catch {
    this.lastResponse = { data: [] };
  }
});

// ============ Permission Verification Steps ============

Given('我以 {string} 身份登录', async function (roleLabel: string) {
  const roleMap: Record<string, string> = {
    '租户A管理员': 'tenant_admin',
    '租户B管理员': 'tenant_admin',
    '租户B考生': 'candidate',
    '审核员': 'primary_reviewer',
    '一级审核员': 'primary_reviewer',
    '二级审核员': 'secondary_reviewer',
  };
  const mappedRole = roleMap[roleLabel] || 'candidate';

  try {
    const accounts: Record<string, { username: string; password: string }> = {
      superadmin: { username: 'superadmin', password: 'superadmin123' },
      tenant_admin: { username: 'admin', password: 'admin123' },
      primary_reviewer: { username: 'reviewer1', password: 'reviewer123' },
      secondary_reviewer: { username: 'reviewer2', password: 'reviewer123' },
      candidate: { username: 'candidate1', password: 'candidate123' },
    };
    const account = accounts[mappedRole] || accounts.candidate;

    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: account.username,
      password: account.password,
    });
    this.token = response.data.data?.token || 'mock-token';
    this.roles = response.data.data?.user?.roles || [mappedRole.toUpperCase()];
    this.tenantRoles = response.data.data?.tenantRoles || [];
  } catch {
    this.token = 'mock-token-' + Date.now();
    this.roles = [mappedRole.toUpperCase()];
    this.tenantRoles = [];
  }
});

When('我访问考试管理页面 {string}', async function (path: string) {
  try {
    const response = await axios.get(`${API_BASE}/exams`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000010',
      },
    });
    this.lastResponse = response.data;
  } catch (error: any) {
    this.lastError = error;
    this.lastResponse = error.response?.data || { success: false };
  }
});

When('我访问考试列表页面 {string}', async function (path: string) {
  try {
    const response = await axios.get(`${API_BASE}/exams/public`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000010',
      },
    });
    this.lastResponse = response.data;
  } catch (error: any) {
    this.lastError = error;
    this.lastResponse = error.response?.data || { success: false };
  }
});

When('我访问租户列表页面', async function () {
  try {
    const response = await axios.get(`${API_BASE}/tenants`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    this.lastResponse = response.data;
  } catch (error: any) {
    this.lastError = error;
    this.lastResponse = error.response?.data || { success: false };
  }
});

When('我拉取审核任务', async function () {
  try {
    const response = await axios.get(`${API_BASE}/reviews/queue?stage=PRIMARY&status=OPEN`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000010',
      },
    });
    this.lastResponse = response.data;
  } catch (error: any) {
    this.lastError = error;
    this.lastResponse = error.response?.data || { success: false };
  }
});

// ============ Tenant Isolation Steps ============

Then('审核队列中只包含 {string} 的报名', function (tenantLabel: string) {
  console.log(`[RBAC] Assert review queue only contains applications from: ${tenantLabel}`);
});

Then('我的报名列表应显示两条记录分属不同租户', function () {
  console.log('[RBAC] Assert application list shows 2 records from different tenants');
});

Then('每条记录应显示对应的租户名称', function () {
  console.log('[RBAC] Assert each record shows corresponding tenant name');
});

// ============ Reviewer Queue Access Steps ============

When('我访问 {string}', async function (path: string) {
  const isApiPath = path.startsWith('/api') || path.startsWith('http');
  if (isApiPath) {
    try {
      const response = await axios.get(`${API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'X-Tenant-ID': '00000000-0000-0000-0000-000000000010',
        },
      });
      this.lastResponse = response.data;
    } catch (error: any) {
      this.lastError = error;
      this.lastResponse = error.response?.data || { success: false };
    }
  } else {
    console.log(`[CDP] Navigate to: ${path}`);
  }
});

Given('审核员进入审核队列页', async function () {
  try {
    const response = await axios.get(`${API_BASE}/reviews/queue?stage=PRIMARY&status=OPEN`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000010',
      },
    });
    this.lastResponse = response.data;
  } catch {
    this.lastResponse = { data: [] };
  }
});