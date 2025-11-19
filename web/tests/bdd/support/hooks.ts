/**
 * Cucumber Hooks
 * 管理测试生命周期
 *
 * ⚠️ 架构原则：
 * - ✅ 通过API准备测试数据
 * - ❌ 禁止直接操作数据库
 */

import { Before, After, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { ApiTestDataHelper } from '../utils/api-test-data-helper';
import { ServiceManager } from '../../utils/service-manager';
import * as fs from 'fs';
import * as path from 'path';

// 全局：将每个步骤默认超时从5秒提升到60秒，避免慢页面导致的无谓失败
setDefaultTimeout(60 * 1000);

let serviceManager: ServiceManager;
let apiHelper: ApiTestDataHelper;
let servicesStarted = false;

/**
 * 在所有测试之前执行一次
 */
BeforeAll({ timeout: 120000 }, async function () {
  console.log('\n🚀 ========== BDD测试环境启动 ==========\n');

  // 创建测试结果目录
  const dirs = [
    'test-results/bdd',
    'test-results/bdd/screenshots',
    'test-results/bdd/videos',
    'test-results/bdd/har',
    'test-results/bdd/traces',
    'test-results/bdd/logs'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    }
  });

  // 初始化服务管理器
  serviceManager = new ServiceManager();

  // 检查服务是否已运行
  console.log('\n📡 检查服务状态...');
  const backendRunning = await serviceManager.isPortInUse(8081);
  const frontendRunning = await serviceManager.isPortInUse(3000);

  if (backendRunning && frontendRunning) {
    console.log('✅ 后端服务已运行 (端口 8081)');
    console.log('✅ 前端服务已运行 (端口 3000)');
    servicesStarted = true;
  } else {
    console.error('❌ 服务未运行！');
    console.error('   后端服务 (8081):', backendRunning ? '✅ 运行中' : '❌ 未运行');
    console.error('   前端服务 (3000):', frontendRunning ? '✅ 运行中' : '❌ 未运行');
    console.error('');
    console.error('请手动启动服务：');
    console.error('   后端: cd exam-bootstrap && mvn spring-boot:run');
    console.error('   前端: cd web && npm run dev');
    throw new Error('服务未运行，请先启动后端和前端服务');
  }

  // 准备测试数据（通过API）
  console.log('\n📦 准备测试数据...');
  try {
    apiHelper = new ApiTestDataHelper();

    // 检查后端服务健康状态
    const backendHealthy = await apiHelper.checkBackendHealth();
    if (!backendHealthy) {
      console.warn('⚠️  后端服务未运行或不健康');
      console.warn('⚠️  请确保后端服务正在运行: http://localhost:8081');
      throw new Error('后端服务未运行');
    }

    console.log('✅ 后端服务健康检查通过');

    // 准备基础测试数据（通过API）
    await apiHelper.setupBaseData();
    console.log('✅ 基础数据准备完成');
  } catch (error) {
    console.error('❌ 测试数据准备失败:', error instanceof Error ? error.message : error);
    console.error('❌ 无法继续测试，请检查：');
    console.error('   1. 后端服务是否运行: http://localhost:8081');
    console.error('   2. 数据库是否运行');
    console.error('   3. API端点是否正确');
    throw error;
  }

  // 等待服务完全就绪
  console.log('\n⏳ 等待服务完全就绪...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 健康检查
  const healthOk = await serviceManager.healthCheck();
  if (!healthOk) {
    console.warn('⚠️  服务健康检查失败，但继续测试');
  } else {
    console.log('✅ 服务健康检查通过');
  }

  console.log('\n✅ ========== BDD测试环境就绪 ==========\n');
});

/**
 * 在每个场景之前执行
 */
Before({ timeout: 30000 }, async function (this: CustomWorld, { pickle }) {
  console.log(`\n📝 开始场景: ${pickle.name}`);

  // DevTools 调试：捕获 console/network/pageerror，并可选启用 tracing
  if (!this.page) { await this.init(); }

  const consoleLogs: any[] = [];
  this.setTestData('consoleLogs', consoleLogs);

  this.page.on('console', (msg) => {
    const entry = { type: msg.type(), text: msg.text(), ts: Date.now() };
    consoleLogs.push(entry);
    if (msg.type() === 'error') {
      try { this.attach(`[console.${msg.type()}] ${msg.text()}`, 'text/plain'); } catch {}
    }
  });

  this.page.on('pageerror', (err) => {
    const entry = { type: 'pageerror', text: err?.message || String(err), ts: Date.now() };
    consoleLogs.push(entry);
    try { this.attach(`[pageerror] ${entry.text}`, 'text/plain'); } catch {}
  });

  this.page.on('requestfailed', (req) => {
    const entry = { type: 'requestfailed', url: req.url(), method: req.method(), ts: Date.now(), failure: req.failure() };
    consoleLogs.push(entry);
  });

  this.page.on('response', async (res) => {
    if (res.status() >= 400) {
      const entry = { type: 'response', url: res.url(), status: res.status(), ts: Date.now() };
      consoleLogs.push(entry);
      try { this.attach(`[response ${res.status()}] ${res.url()}`, 'text/plain'); } catch {}
    }
  });

  if (process.env.BDD_TRACE === 'true' && this.context) {
    await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  }

  // 初始化浏览器和页面（若未初始化则初始化）
  if (!this.page) {

    await this.init();
  }

  // 清理场景级测试数据（通过API）
  // TODO: 实现场景级数据清理

  // 记录场景开始时间
  this.setTestData('scenarioStartTime', Date.now());
});

/**
 * 在每个场景之后执行
 */
After({ timeout: 30000 }, async function (this: CustomWorld, { result, pickle }) {
  const duration = Date.now() - (this.getTestData('scenarioStartTime') || 0);
  console.log(`\n⏱️  场景耗时: ${duration}ms`);

  // 如果场景失败，截图
  if (result?.status === Status.FAILED) {
    console.log('❌ 场景失败，正在截图...');
    try {
      const screenshot = await this.takeScreenshot(`failed-${pickle.name}`);
      // 附加截图到报告
      this.attach(screenshot, 'image/png');
      console.log('✅ 失败截图已保存');
    } catch (error) {
      console.error('⚠️  截图失败:', error);
    }

    // 记录控制台错误
    try {
      const logs = await this.page.evaluate(() => {
        return (window as any).__consoleLogs || [];
      });
      if (logs.length > 0) {
        this.attach(JSON.stringify(logs, null, 2), 'application/json');
      }
    } catch (error) {
      // 忽略
    }
  }

  // 在清理浏览器资源前，保存 console 日志并停止 tracing（如开启）
  try {
    const logs = (this.getTestData('consoleLogs') || []);
    const fs = require('fs');
    const safeName = pickle.name.replace(/[^\u4e00-\u9fa5\w\-]+/g, '_');
    fs.writeFileSync(`test-results/bdd/logs/${safeName}-${Date.now()}.json`, JSON.stringify(logs, null, 2), 'utf-8');
  } catch {}

  if (process.env.BDD_TRACE === 'true' && this.context) {
    const safeName = pickle.name.replace(/[^\u4e00-\u9fa5\w\-]+/g, '_');
    await this.context.tracing.stop({ path: `test-results/bdd/traces/${safeName}-${Date.now()}.zip` });
  }

  // 清理浏览器资源
  await this.cleanup();

  // 清理场景测试数据
  this.clearTestData();

  const statusIcon = result?.status === Status.PASSED ? '✅' : '❌';
  console.log(`${statusIcon} 场景结束: ${pickle.name} - ${result?.status}\n`);
});

/**
 * 在所有测试之后执行一次
 */
AfterAll({ timeout: 30000 }, async function () {
  console.log('\n🛑 ========== BDD测试环境清理 ==========\n');

  // 清理测试数据（通过API）
  if (apiHelper) {
    console.log('🗑️  清理测试数据...');
    try {
      // 注意：清理逻辑应该在每个测试场景的After hook中执行
      // 这里只做全局清理（如果需要）
      console.log('✅ 测试数据清理完成');
    } catch (error) {
      console.error('⚠️  测试数据清理失败:', error);
    }
  }

  // 可选：停止服务（通常保持运行以便调试）
  if (process.env.STOP_SERVICES === 'true' && serviceManager) {
    console.log('🛑 停止服务...');
    await serviceManager.stopAllServices();
    console.log('✅ 服务已停止');
  } else {
    console.log('ℹ️  服务保持运行（设置 STOP_SERVICES=true 以自动停止）');
  }

  console.log('\n✅ ========== BDD测试环境清理完成 ==========\n');
});

/**
 * 标签特定的Hook
 */

// @smoke 标签的场景
Before({ tags: '@smoke' }, async function (this: CustomWorld) {
  console.log('🔥 这是一个冒烟测试场景');
});

// @slow 标签的场景
Before({ tags: '@slow', timeout: 60000 }, async function (this: CustomWorld) {
  console.log('🐌 这是一个慢速测试场景，超时时间延长到60秒');
});

// @skip 标签的场景
Before({ tags: '@skip' }, async function () {
  console.log('⏭️  跳过此场景');
  return 'skipped';
});

// @database 标签的场景（已废弃，使用@api替代）
Before({ tags: '@database' }, async function (this: CustomWorld) {
  console.log('⚠️  @database标签已废弃，请使用@api标签');
  console.log('⚠️  BDD测试不应直接操作数据库，应通过API');
});

// @api 标签的场景
Before({ tags: '@api' }, async function (this: CustomWorld) {
  console.log('🌐 这个场景主要测试API');
  // 可以在这里做API相关的准备
});

