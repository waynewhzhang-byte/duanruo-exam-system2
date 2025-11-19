import { test, expect } from '@playwright/test'

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 登录为考生
    await page.goto('/login')
    await page.fill('input[name="username"]', 'candidate')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/candidate')
  })

  test('should display payment page correctly', async ({ page }) => {
    // 导航到报名详情页
    await page.goto('/test-tenant/candidate/applications/test-app-id')
    
    // 点击支付按钮
    await page.click('text=支付报名费用')
    
    // 验证支付页面加载
    await expect(page.locator('h1:has-text("支付报名费用")')).toBeVisible()
    
    // 验证支付方式选项
    await expect(page.locator('text=支付宝')).toBeVisible()
    await expect(page.locator('text=微信支付')).toBeVisible()
    await expect(page.locator('text=模拟支付')).toBeVisible()
    
    // 验证订单信息
    await expect(page.locator('text=订单信息')).toBeVisible()
    await expect(page.locator('text=考试名称')).toBeVisible()
    await expect(page.locator('text=报考岗位')).toBeVisible()
    await expect(page.locator('text=报名费用')).toBeVisible()
  })

  test('should complete mock payment successfully', async ({ page }) => {
    // 导航到支付页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment')
    
    // 选择模拟支付
    await page.click('input[value="MOCK"]')
    
    // 点击立即支付
    await page.click('button:has-text("立即支付")')
    
    // 等待支付成功页面
    await page.waitForURL('**/payment/success')
    
    // 验证支付成功提示
    await expect(page.locator('h1:has-text("支付成功")')).toBeVisible()
    await expect(page.locator('text=您的报名费用已支付成功')).toBeVisible()
    
    // 验证订单信息
    await expect(page.locator('text=订单信息')).toBeVisible()
    await expect(page.locator('text=已支付')).toBeVisible()
  })

  test('should select different payment methods', async ({ page }) => {
    // 导航到支付页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment')
    
    // 选择支付宝
    await page.click('input[value="ALIPAY"]')
    await expect(page.locator('input[value="ALIPAY"]')).toBeChecked()
    
    // 选择微信支付
    await page.click('input[value="WECHAT"]')
    await expect(page.locator('input[value="WECHAT"]')).toBeChecked()
    
    // 选择模拟支付
    await page.click('input[value="MOCK"]')
    await expect(page.locator('input[value="MOCK"]')).toBeChecked()
  })

  test('should redirect if already paid', async ({ page }) => {
    // Mock API response for already paid application
    await page.route('**/api/v1/applications/test-app-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-app-id',
          paymentStatus: 'PAID',
          reviewStatus: 'APPROVED',
          examTitle: 'Test Exam',
          positionTitle: 'Test Position',
          feeAmount: 100.00,
        }),
      })
    })
    
    // 导航到支付页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment')
    
    // 应该自动跳转到成功页面
    await page.waitForURL('**/payment/success')
  })

  test('should redirect if review not approved', async ({ page }) => {
    // Mock API response for not approved application
    await page.route('**/api/v1/applications/test-app-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-app-id',
          paymentStatus: 'PENDING',
          reviewStatus: 'PENDING',
          examTitle: 'Test Exam',
          positionTitle: 'Test Position',
          feeAmount: 100.00,
        }),
      })
    })
    
    // 导航到支付页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment')
    
    // 应该跳转回报名详情页
    await page.waitForURL('**/applications/test-app-id')
  })

  test('should display payment success page correctly', async ({ page }) => {
    // 导航到支付成功页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment/success')
    
    // 验证成功提示
    await expect(page.locator('h1:has-text("支付成功")')).toBeVisible()
    
    // 验证下一步操作按钮
    await expect(page.locator('text=查看准考证')).toBeVisible()
    await expect(page.locator('text=查看报名详情')).toBeVisible()
    await expect(page.locator('text=返回报名列表')).toBeVisible()
    
    // 验证温馨提示
    await expect(page.locator('text=温馨提示')).toBeVisible()
  })

  test('should display payment failed page correctly', async ({ page }) => {
    // 导航到支付失败页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment/failed')
    
    // 验证失败提示
    await expect(page.locator('h1:has-text("支付失败")')).toBeVisible()
    await expect(page.locator('text=很抱歉，您的支付未能成功完成')).toBeVisible()
    
    // 验证可能的原因
    await expect(page.locator('text=可能的原因')).toBeVisible()
    
    // 验证操作按钮
    await expect(page.locator('button:has-text("重新支付")')).toBeVisible()
    await expect(page.locator('button:has-text("返回报名详情")')).toBeVisible()
    
    // 验证帮助信息
    await expect(page.locator('text=需要帮助？')).toBeVisible()
  })

  test('should navigate from success page to ticket page', async ({ page }) => {
    // 导航到支付成功页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment/success')
    
    // 点击查看准考证
    await page.click('text=查看准考证')
    
    // 验证跳转到准考证页面
    await page.waitForURL('**/candidate/tickets')
  })

  test('should navigate from failed page to payment page', async ({ page }) => {
    // 导航到支付失败页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment/failed')
    
    // 点击重新支付
    await page.click('button:has-text("重新支付")')
    
    // 验证跳转到支付页面
    await page.waitForURL('**/payment')
  })

  test('should show loading state during payment', async ({ page }) => {
    // 导航到支付页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment')
    
    // 延迟API响应
    await page.route('**/api/v1/payments/initiate', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          outTradeNo: 'ORDER123',
          payUrl: null,
          qrCode: null,
        }),
      })
    })
    
    // 点击立即支付
    await page.click('button:has-text("立即支付")')
    
    // 验证加载状态
    await expect(page.locator('text=处理中...')).toBeVisible()
  })

  test('should display payment amount correctly', async ({ page }) => {
    // Mock API response with specific amount
    await page.route('**/api/v1/applications/test-app-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-app-id',
          paymentStatus: 'PENDING',
          reviewStatus: 'APPROVED',
          examTitle: 'Test Exam',
          positionTitle: 'Test Position',
          feeAmount: 150.50,
        }),
      })
    })
    
    // 导航到支付页面
    await page.goto('/test-tenant/candidate/applications/test-app-id/payment')
    
    // 验证金额显示
    await expect(page.locator('text=¥150.50')).toBeVisible()
  })
})

