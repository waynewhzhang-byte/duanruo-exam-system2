import { APIRequestContext, expect } from '@playwright/test';

/**
 * API请求帮助类
 */
export class ApiHelper {
  private request: APIRequestContext;
  private baseURL: string;
  private authToken?: string;

  constructor(request: APIRequestContext, baseURL: string = 'http://localhost:3000') {
    this.request = request;
    this.baseURL = baseURL;
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * 用户登录
   */
  async login(username: string, password: string): Promise<string> {
    const response = await this.request.post(`${this.baseURL}/api/v1/auth/login`, {
      headers: this.getHeaders(),
      data: {
        username,
        password
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    if (data.token) {
      this.setAuthToken(data.token);
      return data.token;
    }
    
    throw new Error('登录失败：未返回token');
  }

  /**
   * 用户注册
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
  }): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/auth/register`, {
      headers: this.getHeaders(),
      data: userData
    });

    expect(response.status()).toBe(201);
    return await response.json();
  }

  /**
   * 创建考试
   */
  async createExam(examData: {
    code: string;
    title: string;
    description: string;
    registrationStart: Date;
    registrationEnd: Date;
    feeRequired: boolean;
  }): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/exams`, {
      headers: this.getHeaders(),
      data: {
        ...examData,
        registrationStart: examData.registrationStart.toISOString(),
        registrationEnd: examData.registrationEnd.toISOString()
      }
    });

    expect(response.status()).toBe(201);
    return await response.json();
  }

  /**
   * 开放考试报名
   */
  async openExam(examId: string): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/exams/${examId}/open`, {
      headers: this.getHeaders(),
      data: {}
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * 关闭考试报名
   */
  async closeExam(examId: string): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/exams/${examId}/close`, {
      headers: this.getHeaders(),
      data: {}
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * 创建岗位
   */
  async createPosition(examId: string, positionData: {
    code: string;
    title: string;
    description: string;
    quota: number;
  }): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/exams/${examId}/positions`, {
      headers: this.getHeaders(),
      data: positionData
    });

    expect(response.status()).toBe(201);
    return await response.json();
  }

  /**
   * 创建科目
   */
  async createSubject(positionId: string, subjectData: {
    name: string;
    durationMinutes: number;
    type: string;
    maxScore: number;
    passingScore: number;
    weight: number;
    ordering: number;
  }): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/positions/${positionId}/subjects`, {
      headers: this.getHeaders(),
      data: subjectData
    });

    expect(response.status()).toBe(201);
    return await response.json();
  }

  /**
   * 提交申请
   */
  async submitApplication(applicationData: {
    examId: string;
    positionId: string;
    formVersion: number;
    payload: any;
  }): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/applications`, {
      headers: this.getHeaders(),
      data: applicationData
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * 支付申请
   */
  async payApplication(applicationId: string, channel: string = 'STUB'): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/applications/${applicationId}/pay`, {
      headers: this.getHeaders(),
      data: { channel }
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * 生成准考证
   */
  async generateTicket(applicationId: string): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/tickets/application/${applicationId}/generate`, {
      headers: this.getHeaders(),
      data: {}
    });

    expect(response.status()).toBe(201);
    return await response.json();
  }

  /**
   * 获取考试列表
   */
  async getExams(): Promise<any> {
    const response = await this.request.get(`${this.baseURL}/api/v1/exams`, {
      headers: this.getHeaders()
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * 获取申请列表
   */
  async getApplications(): Promise<any> {
    const response = await this.request.get(`${this.baseURL}/api/v1/applications`, {
      headers: this.getHeaders()
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * 分配座位
   */
  async allocateSeats(examId: string): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/v1/exams/${examId}/allocate-seats`, {
      headers: this.getHeaders(),
      data: {}
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request.get(`${this.baseURL}/api/v1/health`);
      return response.status() === 200;
    } catch (error) {
      return false;
    }
  }
}
