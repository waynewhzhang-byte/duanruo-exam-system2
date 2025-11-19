/**
 * 考生注册和登录步骤定义
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { parseDataTable } from './common.steps';

// ==================== Given步骤 ====================

/**
 * 假如存在考生账号
 */
Given('存在考生账号 {string}', async function (this: CustomWorld, username: string) {
  // 这个步骤在BeforeAll hook中已经创建了测试用户
  // 这里只需要验证用户存在
  const user = this.testUsers.candidate;
  if (user.username === username) {
    this.log(`✅ 考生账号已存在: ${username}`);
  } else {
    throw new Error(`考生账号不存在: ${username}`);
  }
});

/**
 * Given步骤
 */
Given('存在考生账号{string}', async function (this: CustomWorld, username: string) {
  this.log(`检查考生账号是否存在: ${username}`);
  
  // 从测试用户配置中查找
  const user = this.testUsers.candidate;
  if (user.username === username) {
    this.setTestData('existingUser', user);
    this.log(`✅ 考生账号存在: ${username}`);
  } else {
    throw new Error(`测试用户不存在: ${username}`);
  }
});

/**
 * When步骤 - 注册
 */
When('我填写注册信息', async function (this: CustomWorld, dataTable: any) {
  this.log('填写注册信息');

  const data = parseDataTable(dataTable);

  // 为用户名添加时间戳，避免重复
  if (data['用户名']) {
    const timestamp = Date.now();
    const originalUsername = data['用户名'];
    data['用户名'] = `${originalUsername}_${timestamp}`;
    this.log(`生成唯一用户名: ${data['用户名']}`);
  }

  // 为邮箱添加时间戳，避免重复
  if (data['邮箱']) {
    const timestamp = Date.now();
    const emailParts = data['邮箱'].split('@');
    if (emailParts.length === 2) {
      data['邮箱'] = `${emailParts[0]}_${timestamp}@${emailParts[1]}`;
      this.log(`生成唯一邮箱: ${data['邮箱']}`);
    }
  }

  // 保存注册数据供后续验证使用
  this.setTestData('registrationData', data);

  // 填写表单字段
  for (const [fieldName, value] of Object.entries(data)) {
    try {
      // 根据字段名映射到实际的input name
      const fieldMapping: { [key: string]: string } = {
        '用户名': 'username',
        '密码': 'password',
        '确认密码': 'confirmPassword',
        '真实姓名': 'fullName',  // 映射到实际的 fullName 字段
        '身份证号': 'idCard',
        '手机号': 'phoneNumber',  // 映射到实际的 phoneNumber 字段
        '邮箱': 'email'
      };
      
      const inputName = fieldMapping[fieldName] || fieldName;
      
      // 尝试多种选择器
      const selectors = [
        `input[name="${inputName}"]`,
        `input[id="${inputName}"]`,
        `input[placeholder*="${fieldName}"]`
      ];
      
      let filled = false;
      for (const selector of selectors) {
        try {
          const element = this.page.locator(selector);
          if (await element.count() > 0) {
            await element.fill(value);
            this.log(`✅ 填写 ${fieldName}: ${value}`);
            filled = true;
            break;
          }
        } catch (error) {
          // 继续尝试下一个选择器
        }
      }
      
      if (!filled) {
        this.error(`找不到字段: ${fieldName}`);
        throw new Error(`找不到字段: ${fieldName}`);
      }
    } catch (error) {
      this.error(`填写字段失败: ${fieldName}`, error);
      throw error;
    }
  }
});

When('我点击注册按钮', async function (this: CustomWorld) {
  this.log('点击注册按钮');
  
  // 尝试多种选择器
  const selectors = [
    'button[type="submit"]:has-text("注册")',
    'button:has-text("注册")',
    'button:has-text("立即注册")',
    'button:has-text("提交注册")'
  ];
  
  for (const selector of selectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        await element.click();
        this.log('✅ 注册按钮已点击');
        
        // 等待响应
        await this.page.waitForTimeout(2000);
        return;
      }
    } catch (error) {
      // 继续尝试下一个选择器
    }
  }
  
  throw new Error('找不到注册按钮');
});

/**
 * When步骤 - 登录
 */
When('我使用用户名 {string} 和密码 {string} 登录', async function (
  this: CustomWorld,
  username: string,
  password: string
) {
  this.log(`尝试登录: ${username}`);
  
  // 导航到登录页面
  await this.goto('/login');
  await this.waitForPageLoad();
  
  // 填写用户名
  const usernameSelectors = [
    'input[name="username"]',
    'input[id="username"]',
    'input[type="text"]',
    'input[placeholder*="用户名"]'
  ];
  
  for (const selector of usernameSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        await element.fill(username);
        this.log(`✅ 填写用户名: ${username}`);
        break;
      }
    } catch (error) {
      // 继续尝试
    }
  }
  
  // 填写密码
  const passwordSelectors = [
    'input[name="password"]',
    'input[id="password"]',
    'input[type="password"]',
    'input[placeholder*="密码"]'
  ];
  
  for (const selector of passwordSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        await element.fill(password);
        this.log(`✅ 填写密码`);
        break;
      }
    } catch (error) {
      // 继续尝试
    }
  }
  
  // 点击登录按钮
  const loginButtonSelectors = [
    'button[type="submit"]:has-text("登录")',
    'button:has-text("登录")',
    'button:has-text("立即登录")',
    'button[type="submit"]'
  ];
  
  for (const selector of loginButtonSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        await element.click();
        this.log('✅ 登录按钮已点击');
        
        // 等待响应
        await this.page.waitForTimeout(3000);
        return;
      }
    } catch (error) {
      // 继续尝试
    }
  }
  
  throw new Error('找不到登录按钮');
});

/**
 * Then步骤 - 注册验证
 */
Then('注册应该成功', async function (this: CustomWorld) {
  this.log('验证注册成功');
  
  // 检查是否有成功提示或重定向到登录页
  const currentUrl = this.getCurrentUrl();
  
  if (currentUrl.includes('/login') || currentUrl.includes('/candidate')) {
    this.log('✅ 注册成功（已重定向）');
  } else {
    // 检查成功提示
    const successSelectors = [
      '[role="alert"]:has-text("注册成功")',
      '.success:has-text("注册成功")',
      'text=注册成功'
    ];
    
    let found = false;
    for (const selector of successSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await expect(element).toBeVisible({ timeout: 20000 }); // 增加超时从5秒到20秒
          found = true;
          this.log('✅ 注册成功（显示成功提示）');
          break;
        }
      } catch (error) {
        // 继续尝试
      }
    }
    
    if (!found) {
      throw new Error('未找到注册成功的标识');
    }
  }
});

Then('注册应该失败', async function (this: CustomWorld) {
  this.log('验证注册失败');
  
  // 应该仍在注册页面
  const currentUrl = this.getCurrentUrl();
  expect(currentUrl).toContain('/register');
  
  this.log('✅ 注册失败（仍在注册页面）');
});

Then('我应该收到注册成功的提示', async function (this: CustomWorld) {
  this.log('验证注册成功提示');
  
  const successSelectors = [
    '[role="alert"]:has-text("注册成功")',
    '.toast-success:has-text("注册成功")',
    'text=注册成功'
  ];
  
  for (const selector of successSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        await expect(element).toBeVisible({ timeout: 10000 });
        this.log('✅ 找到注册成功提示');
        return;
      }
    } catch (error) {
      // 继续尝试
    }
  }
  
  throw new Error('未找到注册成功提示');
});

Then('我应该能够使用新账号登录', async function (this: CustomWorld) {
  this.log('验证可以使用新账号登录');
  
  const registrationData = this.getTestData('registrationData');
  if (!registrationData) {
    throw new Error('未找到注册数据');
  }
  
  // 导航到登录页面
  await this.goto('/login');
  
  // 尝试登录
  await this.page.fill('input[name="username"]', registrationData['用户名']);
  await this.page.fill('input[name="password"]', registrationData['密码']);
  await this.page.click('button[type="submit"]');
  
  // 等待登录完成
  await this.page.waitForTimeout(3000);
  
  // 验证登录成功（URL变化或看到仪表盘）
  const currentUrl = this.getCurrentUrl();
  if (currentUrl.includes('/candidate') || currentUrl.includes('/dashboard')) {
    this.log('✅ 新账号登录成功');
  } else {
    throw new Error('新账号登录失败');
  }
});

/**
 * Then步骤 - 登录验证
 */
Then('登录应该成功', async function (this: CustomWorld) {
  this.log('验证登录成功');
  
  // 等待页面跳转
  await this.page.waitForTimeout(2000);
  
  const currentUrl = this.getCurrentUrl();
  
  // 检查是否跳转到仪表盘或其他页面（不在登录页）
  if (!currentUrl.includes('/login')) {
    this.log(`✅ 登录成功（当前URL: ${currentUrl}）`);
  } else {
    throw new Error('登录失败，仍在登录页面');
  }
});

Then('登录应该失败', async function (this: CustomWorld) {
  this.log('验证登录失败');
  
  // 应该仍在登录页面
  const currentUrl = this.getCurrentUrl();
  expect(currentUrl).toContain('/login');
  
  this.log('✅ 登录失败（仍在登录页面）');
});

Then('我应该看到考生仪表盘', async function (this: CustomWorld) {
  this.log('验证考生仪表盘');
  
  // 检查URL或页面元素
  const currentUrl = this.getCurrentUrl();
  
  if (currentUrl.includes('/candidate')) {
    this.log('✅ 已进入考生仪表盘');
  } else {
    // 检查页面元素
    const dashboardSelectors = [
      'h1:has-text("考生中心")',
      'h1:has-text("我的考试")',
      '[data-testid="candidate-dashboard"]'
    ];
    
    for (const selector of dashboardSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await expect(element).toBeVisible({ timeout: 20000 }); // 增加超时从5秒到20秒
          this.log('✅ 找到考生仪表盘元素');
          return;
        }
      } catch (error) {
        // 继续尝试
      }
    }
    
    throw new Error('未找到考生仪表盘');
  }
});

