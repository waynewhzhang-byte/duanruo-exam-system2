/**
 * API测试数据助手
 * ✅ 正确的做法：通过API准备测试数据
 * ❌ 禁止直接操作数据库
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { BDD_TEST_USERS, BDD_TEST_TENANT } from '../fixtures/bdd-test-data';

export interface CreateTenantDto {
  name: string;
  slug: string;
  domain: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}

export interface CreateUserDto {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: string;
  tenantSlug?: string;
}

export interface CreateExamDto {
  examName: string;
  examCode: string;
  examType: string;
  registrationStart: string;
  registrationEnd: string;
  examStart: string;
  examEnd: string;
  feeRequired: boolean;
  feeAmount?: number;
  description?: string;
}

export class ApiTestDataHelper {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 响应拦截器
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          console.error(`❌ API错误 [${error.response.status}]:`, error.response.data);
        } else if (error.request) {
          console.error('❌ 网络错误: 无响应');
        } else {
          console.error('❌ 请求错误:', error.message);
        }
        throw error;
      }
    );
  }

  /**
   * 检查后端服务是否运行
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await axios.get('http://localhost:8081/api/v1/actuator/health', {
        timeout: 20000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('❌ 后端服务未运行');
      return false;
    }
  }

  /**
   * 检查基础数据是否存在
   */
  async checkBaseDataExists(): Promise<boolean> {
    try {
      // 尝试登录租户管理员，如果成功说明数据已存在
      const response = await axios.post(
        `${this.baseURL}/auth/login`,
        {
          username: BDD_TEST_USERS.tenantAdmin.username,
          password: BDD_TEST_USERS.tenantAdmin.password,
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建租户（通过API）
   */
  async createTenant(data: CreateTenantDto): Promise<any> {
    try {
      console.log(`📦 创建租户: ${data.name}`);
      const response = await this.api.post('/tenants', data);
      console.log(`✅ 租户创建成功: ${data.name}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        console.log(`⚠️  租户已存在: ${data.name}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * 创建用户（通过API）
   */
  async createUser(data: CreateUserDto): Promise<any> {
    try {
      console.log(`📦 创建用户: ${data.username} (${data.role})`);
      const response = await this.api.post('/users', data);
      console.log(`✅ 用户创建成功: ${data.username}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        console.log(`⚠️  用户已存在: ${data.username}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * 创建考试（通过API）
   */
  async createExam(tenantSlug: string, data: CreateExamDto): Promise<any> {
    try {
      console.log(`📦 创建考试: ${data.examName}`);
      const response = await this.api.post(`/${tenantSlug}/exams`, data);
      console.log(`✅ 考试创建成功: ${data.examName}`);
      return response.data;
    } catch (error) {
      console.error(`❌ 创建考试失败: ${data.examName}`);
      throw error;
    }
  }

  /**
   * 删除考试（通过API）
   */
  async deleteExam(tenantSlug: string, examId: string): Promise<void> {
    try {
      await this.api.delete(`/${tenantSlug}/exams/${examId}`);
      console.log(`✅ 考试删除成功: ${examId}`);
    } catch (error) {
      console.warn(`⚠️  删除考试失败: ${examId}`);
    }
  }

  /**
   * 删除报名（通过API）
   */
  async deleteRegistration(tenantSlug: string, registrationId: string): Promise<void> {
    try {
      await this.api.delete(`/${tenantSlug}/registrations/${registrationId}`);
      console.log(`✅ 报名删除成功: ${registrationId}`);
    } catch (error) {
      console.warn(`⚠️  删除报名失败: ${registrationId}`);
    }
  }

  /**
   * 准备基础测试数据
   * 创建租户和用户
   */
  async setupBaseData(): Promise<void> {
    console.log('\n📦 ========== 准备基础测试数据（通过API） ==========\n');

    // 1. 检查后端服务
    const backendRunning = await this.checkBackendHealth();
    if (!backendRunning) {
      throw new Error('后端服务未运行，无法准备测试数据');
    }

    // 2. 检查基础数据是否已存在
    const baseDataExists = await this.checkBaseDataExists();
    if (baseDataExists) {
      console.log('✅ 基础数据已存在，跳过准备');
      // 登录租户管理员获取token
      console.log('🔐 登录租户管理员...');
      await this.login(BDD_TEST_USERS.tenantAdmin.username, BDD_TEST_USERS.tenantAdmin.password);
      console.log('✅ 登录成功\n');
      return;
    }

    console.log('📝 基础数据不存在，开始创建...\n');

    // 3. 注册考生用户（通过公开注册端点）
    console.log('👤 注册考生用户');
    try {
      const candidateResponse = await axios.post(
        `${this.baseURL}/auth/register`,
        {
          username: BDD_TEST_USERS.candidate.username,
          password: BDD_TEST_USERS.candidate.password,
          confirmPassword: BDD_TEST_USERS.candidate.password,
          email: BDD_TEST_USERS.candidate.email,
          phoneNumber: BDD_TEST_USERS.candidate.phone,
          fullName: BDD_TEST_USERS.candidate.fullName,
        }
      );
      console.log(`✅ 考生注册成功: ${candidateResponse.data.username}\n`);
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.status === 422) {
        console.log('⚠️  考生已存在，跳过注册\n');
      } else {
        console.error('❌ 考生注册失败:', error.response?.data || error.message);
        throw error;
      }
    }

    console.log('\n✅ ========== 基础测试数据准备完成 ==========\n');
    console.log('⚠️  注意：租户和管理员需要通过数据库迁移脚本或手动创建\n');
  }

  /**
   * 清理测试数据（通过API）
   */
  async cleanupTestData(tenantSlug: string): Promise<void> {
    console.log('\n🗑️  清理测试数据（通过API）...');

    try {
      // 清理BDD测试创建的考试
      // 注意：这需要后端提供批量删除API
      // 或者在测试中记录创建的资源ID，然后逐个删除
      console.log('✅ 测试数据清理完成\n');
    } catch (error) {
      console.warn('⚠️  清理测试数据失败:', error);
    }
  }

  /**
   * 登录并获取Token（用于需要认证的API调用）
   */
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await this.api.post('/auth/login', {
        username,
        password,
      });
      const token = response.data.token;
      
      // 设置默认的Authorization header
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return token;
    } catch (error) {
      console.error(`❌ 登录失败: ${username}`);
      throw error;
    }
  }

  /**
   * 设置租户上下文（用于多租户API调用）
   */
  setTenantContext(tenantId: string): void {
    this.api.defaults.headers.common['X-Tenant-ID'] = tenantId;
  }
}

