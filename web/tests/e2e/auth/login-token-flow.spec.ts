import { test, expect } from '@playwright/test';

test.describe('登录 Token 流程验证', () => {
  test('应该正确保存和使用 JWT Token', async ({ page, context }) => {
    // 1. 访问登录页面
    await page.goto('http://localhost:3000/login?role=admin');
    await page.waitForLoadState('networkidle');

    // 2. 填写登录表单
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123@Abc');

    // 3. 监听网络请求
    const loginRequest = page.waitForResponse(
      response => response.url().includes('/api/v1/auth/login') && response.status() === 200
    );

    const sessionRequest = page.waitForResponse(
      response => response.url().includes('/api/session') && response.status() === 200
    );

    // 4. 点击登录按钮
    await page.click('button[type="submit"]');

    // 5. 等待登录请求完成
    const loginResp = await loginRequest;
    const loginData = await loginResp.json();
    
    console.log('登录响应:', {
      hasToken: !!loginData.token,
      tokenLength: loginData.token?.length,
      hasUser: !!loginData.user,
      username: loginData.user?.username
    });

    expect(loginData.token).toBeTruthy();
    expect(loginData.user).toBeTruthy();

    // 6. 等待 session 请求完成
    const sessionResp = await sessionRequest;
    const sessionData = await sessionResp.json();
    
    console.log('Session 响应:', sessionData);
    expect(sessionData.success).toBe(true);

    // 7. 等待页面跳转
    await page.waitForURL(/\/(tenants|admin)/, { timeout: 5000 });

    // 8. 检查 Cookie 是否设置
    const cookies = await context.cookies();
    const authTokenCookie = cookies.find(c => c.name === 'auth-token');
    const userInfoCookie = cookies.find(c => c.name === 'user-info');

    console.log('Cookies:', {
      authToken: authTokenCookie ? {
        name: authTokenCookie.name,
        value: authTokenCookie.value.substring(0, 50) + '...',
        httpOnly: authTokenCookie.httpOnly,
        path: authTokenCookie.path
      } : null,
      userInfo: userInfoCookie ? {
        name: userInfoCookie.name,
        httpOnly: userInfoCookie.httpOnly,
        path: userInfoCookie.path
      } : null
    });

    expect(authTokenCookie).toBeTruthy();
    expect(authTokenCookie?.value).toBe(loginData.token);
    expect(userInfoCookie).toBeTruthy();

    // 9. 尝试调用需要认证的 API
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/v1/tenants', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        return {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          body: response.ok ? await response.json() : await response.text()
        };
      } catch (error: any) {
        return {
          error: error.message
        };
      }
    });

    console.log('API 调用结果:', apiResponse);

    // 10. 验证 API 调用成功（不是 401）
    expect(apiResponse.status).not.toBe(401);
    expect(apiResponse.ok).toBe(true);
  });

  test('应该在 Cookie 中正确读取 Token', async ({ page }) => {
    // 手动设置 Cookie 模拟已登录状态
    const mockToken = 'eyJhbGciOiJIUzUxMiJ9.test.token';
    const mockUser = {
      id: 'test-user-id',
      username: 'admin',
      roles: ['SUPER_ADMIN']
    };

    await page.context().addCookies([
      {
        name: 'auth-token',
        value: mockToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax'
      },
      {
        name: 'user-info',
        value: JSON.stringify(mockUser),
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax'
      }
    ]);

    // 访问需要认证的页面
    await page.goto('http://localhost:3000/tenants');

    // 检查页面中的 JavaScript 是否能读取 Cookie
    const cookieCheck = await page.evaluate(() => {
      const cookies = document.cookie;
      const authToken = cookies.split('; ').find(row => row.startsWith('auth-token='));
      const userInfo = cookies.split('; ').find(row => row.startsWith('user-info='));
      
      return {
        hasCookies: !!cookies,
        hasAuthToken: !!authToken,
        hasUserInfo: !!userInfo,
        authTokenValue: authToken?.split('=')[1],
        userInfoValue: userInfo ? decodeURIComponent(userInfo.split('=')[1]) : null
      };
    });

    console.log('Cookie 读取检查:', cookieCheck);

    // httpOnly cookie 不应该在 JavaScript 中可见
    expect(cookieCheck.hasAuthToken).toBe(false); // httpOnly=true
    expect(cookieCheck.hasUserInfo).toBe(true);   // httpOnly=false
  });
});

