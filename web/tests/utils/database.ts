import { Client } from 'pg';

/**
 * 数据库连接配置
 */
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'duanruo-exam-system',
  user: 'postgres',
  password: 'zww0625wh'
};

/**
 * 数据库工具类
 */
export class DatabaseHelper {
  private client: Client | null = null;
  private isConnected: boolean = false;

  /**
   * 连接数据库
   */
  async connect(): Promise<void> {
    // 如果已经连接，直接返回
    if (this.isConnected && this.client) {
      console.log('数据库已连接，跳过重复连接');
      return;
    }

    try {
      // 创建新的客户端实例
      this.client = new Client(DB_CONFIG);
      await this.client.connect();
      this.isConnected = true;
      console.log('数据库连接成功');
    } catch (error) {
      console.error('数据库连接失败:', error);
      this.isConnected = false;
      this.client = null;
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<void> {
    if (!this.client || !this.isConnected) {
      console.log('数据库未连接，无需断开');
      return;
    }

    try {
      await this.client.end();
      this.isConnected = false;
      this.client = null;
      console.log('数据库连接已断开');
    } catch (error) {
      console.error('断开数据库连接失败:', error);
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * 执行SQL查询
   */
  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('数据库未连接，请先调用connect()');
    }

    try {
      const result = await this.client.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('SQL查询失败:', error);
      throw error;
    }
  }

  /**
   * 清理测试数据
   */
  async cleanupTestData(): Promise<void> {
    try {
      // 删除测试用户（除了admin）
      await this.query(`
        DELETE FROM users 
        WHERE username LIKE 'test_%' 
        OR email LIKE '%@test.com'
      `);

      // 删除测试考试
      await this.query(`
        DELETE FROM exams 
        WHERE code LIKE 'E2E_TEST_%' 
        OR title LIKE '%测试%'
      `);

      console.log('测试数据清理完成');
    } catch (error) {
      console.error('清理测试数据失败:', error);
      throw error;
    }
  }

  /**
   * 创建测试用户
   */
  async createTestUser(userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    roles: string[];
  }): Promise<string> {
    try {
      const hashedPassword = await this.hashPassword(userData.password);
      const result = await this.query(`
        INSERT INTO users (
          id, username, email, password_hash, full_name, roles, 
          email_verified, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, true, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) 
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          roles = EXCLUDED.roles,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [
        userData.username,
        userData.email,
        hashedPassword,
        userData.fullName,
        JSON.stringify(userData.roles)
      ]);

      return result[0]?.id;
    } catch (error) {
      console.error('创建测试用户失败:', error);
      throw error;
    }
  }

  /**
   * 验证管理员用户存在，如果不存在则创建
   */
  async ensureAdminExists(): Promise<boolean> {
    try {
      // 检查管理员用户是否存在
      const result = await this.query(`
        SELECT id FROM users
        WHERE username = 'admin'
      `);

      if (result.length === 0) {
        console.warn('管理员用户不存在，尝试创建...');

        try {
          // 创建管理员用户
          // 密码: admin123@Abc (BCrypt加密后的哈希值)
          await this.query(`
            INSERT INTO users (id, username, password, email, full_name, roles, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              'admin',
              '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
              'admin@duanruo.com',
              '系统管理员',
              '["ADMIN"]'::jsonb,
              NOW(),
              NOW()
            )
            ON CONFLICT (username) DO NOTHING
          `);

          console.log('✅ 管理员用户创建成功');
          return true;
        } catch (createError) {
          console.error('❌ 创建管理员用户失败:', createError);
          return false;
        }
      }

      console.log('✅ 管理员用户已存在');
      return true;
    } catch (error) {
      console.error('验证管理员用户失败:', error);
      return false;
    }
  }

  /**
   * 获取考试数据
   */
  async getExamByCode(code: string): Promise<any> {
    try {
      const result = await this.query(`
        SELECT * FROM exams WHERE code = $1
      `, [code]);

      return result[0] || null;
    } catch (error) {
      console.error('获取考试数据失败:', error);
      throw error;
    }
  }

  /**
   * 删除考试及相关数据
   */
  async deleteExamAndRelatedData(examId: string): Promise<void> {
    try {
      // 删除申请
      await this.query(`
        DELETE FROM applications 
        WHERE position_id IN (
          SELECT id FROM positions WHERE exam_id = $1
        )
      `, [examId]);

      // 删除科目
      await this.query(`
        DELETE FROM subjects 
        WHERE position_id IN (
          SELECT id FROM positions WHERE exam_id = $1
        )
      `, [examId]);

      // 删除岗位
      await this.query(`
        DELETE FROM positions WHERE exam_id = $1
      `, [examId]);

      // 删除考试
      await this.query(`
        DELETE FROM exams WHERE id = $1
      `, [examId]);

      console.log('考试及相关数据删除完成');
    } catch (error) {
      console.error('删除考试数据失败:', error);
      throw error;
    }
  }

  /**
   * 简单的密码哈希（用于测试）
   */
  private async hashPassword(password: string): Promise<string> {
    // 在实际应用中，这应该使用bcrypt或类似的库
    // 这里使用PostgreSQL的crypt函数
    const result = await this.query(`
      SELECT crypt($1, gen_salt('bf')) as hash
    `, [password]);

    return result[0].hash;
  }

  /**
   * 检查数据库连接
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('数据库连接检查失败:', error);
      return false;
    }
  }
}
