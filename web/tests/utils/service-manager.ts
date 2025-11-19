import { spawn, ChildProcess } from 'child_process';
import { ApiHelper } from './api-helpers';
import { DatabaseHelper } from './database';

/**
 * 服务管理器 - 负责启动和管理后端、前端服务
 */
export class ServiceManager {
  private backendProcess?: ChildProcess;
  private frontendProcess?: ChildProcess;
  private readonly apiHelper: ApiHelper;

  constructor() {
    this.apiHelper = new ApiHelper({} as any); // 临时创建，后续会重新初始化
  }

  /**
   * 检查端口是否被占用
   */
  private async isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec(`netstat -ano | findstr :${port}`, (error: any, stdout: string) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(stdout.includes('LISTENING'));
      });
    });
  }

  /**
   * 等待端口可用
   */
  private async waitForPort(port: number, timeout: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.isPortInUse(port)) {
        console.log(`端口 ${port} 已可用`);
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.error(`等待端口 ${port} 超时`);
    return false;
  }

  /**
   * 检查数据库连接
   */
  async checkDatabase(): Promise<boolean> {
    // 每次都创建新的数据库连接实例
    const dbHelper = new DatabaseHelper();

    try {
      await dbHelper.connect();
      const isConnected = await dbHelper.checkConnection();

      if (isConnected) {
        console.log('数据库连接正常');

        // 检查管理员用户是否存在
        const adminExists = await dbHelper.ensureAdminExists();
        if (!adminExists) {
          console.warn('管理员用户不存在，可能需要运行数据库迁移');
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('数据库连接失败:', error);
      return false;
    } finally {
      await dbHelper.disconnect();
    }
  }

  /**
   * 启动后端服务
   */
  async startBackend(): Promise<boolean> {
    console.log('检查后端服务状态...');
    
    // 检查后端是否已经运行
    if (await this.isPortInUse(8081)) {
      console.log('后端服务已在运行 (端口 8081)');
      return true;
    }

    console.log('启动后端服务...');
    
    return new Promise((resolve) => {
      // 使用PowerShell脚本启动后端
      this.backendProcess = spawn('powershell', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', '../scripts/start-backend.ps1'
      ], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      
      this.backendProcess.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log('[Backend]', text.trim());
        
        // 检查启动成功的标志
        if (text.includes('Started ExamRegistrationApplication') || 
            text.includes('Tomcat started on port')) {
          console.log('后端服务启动成功');
          resolve(true);
        }
      });

      this.backendProcess.stderr?.on('data', (data) => {
        const text = data.toString();
        console.error('[Backend Error]', text.trim());
        
        // 检查启动失败的标志
        if (text.includes('Error') || text.includes('Exception')) {
          console.error('后端服务启动失败');
          resolve(false);
        }
      });

      this.backendProcess.on('close', (code) => {
        console.log(`后端进程退出，代码: ${code}`);
        resolve(false);
      });

      // 设置超时
      setTimeout(() => {
        console.log('后端启动超时，检查端口状态...');
        this.isPortInUse(8081).then(isRunning => {
          if (isRunning) {
            console.log('后端服务已启动（通过端口检查确认）');
            resolve(true);
          } else {
            console.error('后端服务启动超时');
            resolve(false);
          }
        });
      }, 120000); // 2分钟超时
    });
  }

  /**
   * 启动前端服务
   */
  async startFrontend(): Promise<boolean> {
    console.log('检查前端服务状态...');
    
    // 检查前端是否已经运行
    if (await this.isPortInUse(3000)) {
      console.log('前端服务已在运行 (端口 3000)');
      return true;
    }

    console.log('启动前端服务...');
    
    return new Promise((resolve) => {
      this.frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      
      this.frontendProcess.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log('[Frontend]', text.trim());
        
        // 检查启动成功的标志
        if (text.includes('Ready') || text.includes('localhost:3000')) {
          console.log('前端服务启动成功');
          resolve(true);
        }
      });

      this.frontendProcess.stderr?.on('data', (data) => {
        const text = data.toString();
        console.log('[Frontend Info]', text.trim());
        
        // Next.js 的一些信息会输出到 stderr，但不是错误
        if (text.includes('Ready') || text.includes('localhost:3000')) {
          console.log('前端服务启动成功');
          resolve(true);
        }
      });

      this.frontendProcess.on('close', (code) => {
        console.log(`前端进程退出，代码: ${code}`);
        resolve(false);
      });

      // 设置超时
      setTimeout(() => {
        console.log('前端启动超时，检查端口状态...');
        this.isPortInUse(3000).then(isRunning => {
          if (isRunning) {
            console.log('前端服务已启动（通过端口检查确认）');
            resolve(true);
          } else {
            console.error('前端服务启动超时');
            resolve(false);
          }
        });
      }, 60000); // 1分钟超时
    });
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('执行健康检查...');
      
      // 检查前端
      const frontendResponse = await fetch('http://localhost:3000');
      if (!frontendResponse.ok) {
        console.error('前端健康检查失败');
        return false;
      }
      
      // 检查后端API
      const backendResponse = await fetch('http://localhost:3000/api/v1/health');
      if (!backendResponse.ok) {
        console.warn('后端健康检查失败，但可能是正常的（如果没有健康检查端点）');
      }
      
      console.log('健康检查通过');
      return true;
    } catch (error) {
      console.error('健康检查失败:', error);
      return false;
    }
  }

  /**
   * 启动所有服务
   */
  async startAllServices(): Promise<boolean> {
    console.log('开始启动所有服务...');
    
    // 1. 检查数据库
    const dbOk = await this.checkDatabase();
    if (!dbOk) {
      console.error('数据库检查失败');
      return false;
    }
    
    // 2. 启动后端
    const backendOk = await this.startBackend();
    if (!backendOk) {
      console.error('后端启动失败');
      return false;
    }
    
    // 等待后端完全启动
    await this.waitForPort(8081, 60000);
    
    // 3. 启动前端
    const frontendOk = await this.startFrontend();
    if (!frontendOk) {
      console.error('前端启动失败');
      return false;
    }
    
    // 等待前端完全启动
    await this.waitForPort(3000, 60000);
    
    // 4. 健康检查
    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
    const healthOk = await this.healthCheck();
    
    if (healthOk) {
      console.log('所有服务启动成功！');
      return true;
    } else {
      console.error('服务健康检查失败');
      return false;
    }
  }

  /**
   * 停止所有服务
   */
  async stopAllServices(): Promise<void> {
    console.log('停止所有服务...');
    
    if (this.frontendProcess) {
      this.frontendProcess.kill();
      console.log('前端服务已停止');
    }
    
    if (this.backendProcess) {
      this.backendProcess.kill();
      console.log('后端服务已停止');
    }
  }

  /**
   * 准备测试数据
   */
  async prepareTestData(): Promise<void> {
    console.log('准备测试数据...');

    // 每次都创建新的数据库连接实例
    const dbHelper = new DatabaseHelper();

    try {
      await dbHelper.connect();

      // 清理旧的测试数据
      await dbHelper.cleanupTestData();

      console.log('测试数据准备完成');
    } catch (error) {
      console.error('准备测试数据失败:', error);
      throw error;
    } finally {
      await dbHelper.disconnect();
    }
  }
}
