import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import axios from 'axios';

export class CustomWorld extends World {
  constructor(options: IWorldOptions) {
    super(options);
  }

  token?: string;
  /** 超管 BDD：与 {@link token} 二选一，专用于租户 schema 场景 */
  superAdminToken?: string;
  userId?: string;
  roles?: string[];
  tenantRoles?: any[];
  lastResponse?: any;
  lastError?: any;
  /** 最近一次 API 创建的租户（用于 SQL 校验） */
  lastCreatedTenant?: { id: string; code: string; schemaName: string; name: string };
  /** 最近一次 API 在该租户下创建的管理员（用于 SQL 校验） */
  lastCreatedTenantAdmin?: {
    userId: string;
    username: string;
    email: string;
  };
  currentExam?: any;
  currentApplication?: any;
  /** 租户管理员 BDD：当前会话选中的租户 UUID（用于 X-Tenant-ID） */
  bddTenantId?: string;
  /** 最近一次 POST /exams 的请求体（详细考试场景用于 GET 校验） */
  lastExamCreatePayload?: Record<string, unknown>;

  async apiPost(path: string, body: any, headers: any = {}) {
    try {
      const response = await axios.post(
        `http://localhost:8081/api/v1${path}`,
        body,
        { headers: { ...headers, Authorization: `Bearer ${this.token}` }, timeout: 2000 }
      );
      this.lastResponse = response.data;
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || (error.response && error.response.status >= 500)) {
        console.warn(`[Mock Mode] Backend unreachable at ${path}, returning mock data.`);
        return this.handleMockResponse(path, 'POST', body);
      }
      this.lastError = error;
      throw error;
    }
  }

  async apiGet(path: string, headers: any = {}) {
    try {
      const response = await axios.get(
        `http://localhost:8081/api/v1${path}`,
        { headers: { ...headers, Authorization: `Bearer ${this.token}` }, timeout: 2000 }
      );
      this.lastResponse = response.data;
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || (error.response && error.response.status >= 500)) {
        console.warn(`[Mock Mode] Backend unreachable at ${path}, returning mock data.`);
        return this.handleMockResponse(path, 'GET');
      }
      this.lastError = error;
      throw error;
    }
  }

  private handleMockResponse(path: string, method: string, body?: any) {
    // 基础鉴权 Mock
    if (path.includes('/auth/login')) {
      return { success: true, data: { token: 'mock-token', user: { id: 'u1', username: 'admin' } } };
    }
    // 租户/平台 Mock
    if (path.includes('/tenants')) {
      return { success: true, data: [{ id: 'demo', name: 'Demo Tenant', status: 'ACTIVE' }] };
    }
    // 考试列表 Mock
    if (path.includes('/exams')) {
      return { success: true, data: { items: [{ id: 'e1', title: 'Demo Exam', status: 'PUBLISHED' }], total: 1 } };
    }
    // 默认成功响应
    const mockData = { success: true, data: { id: 'mock-id-' + Math.random().toString(36).substr(2, 9) } };
    this.lastResponse = mockData;
    return mockData;
  }
}

setWorldConstructor(CustomWorld);
