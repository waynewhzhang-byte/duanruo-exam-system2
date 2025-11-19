import { test, expect } from '@playwright/test'

test.describe('Seating Allocation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 登录为管理员
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
  })

  test('should display venues page correctly', async ({ page }) => {
    // 导航到考场管理页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    
    // 验证页面标题
    await expect(page.locator('h1:has-text("考场与座位管理")')).toBeVisible()
    
    // 验证标签页
    await expect(page.locator('text=考场管理')).toBeVisible()
    await expect(page.locator('text=座位分配')).toBeVisible()
  })

  test('should create venue successfully', async ({ page }) => {
    // 导航到考场管理页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    
    // 点击添加考场按钮
    await page.click('button:has-text("添加考场")')
    
    // 填写考场信息
    await page.fill('input[name="name"]', '第一考场')
    await page.fill('input[name="capacity"]', '100')
    
    // 提交表单
    await page.click('button[type="submit"]')
    
    // 验证成功提示
    await expect(page.locator('text=考场创建成功')).toBeVisible()
  })

  test('should display seating allocation page correctly', async ({ page }) => {
    // 导航到座位分配页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    await page.click('text=座位分配')
    
    // 验证座位分配控制卡片
    await expect(page.locator('text=座位分配')).toBeVisible()
    await expect(page.locator('button:has-text("执行分配")')).toBeVisible()
  })

  test('should show strategy selector', async ({ page }) => {
    // 导航到座位分配页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    await page.click('text=座位分配')
    
    // 点击显示策略选项
    await page.click('button:has-text("显示策略选项")')
    
    // 验证策略选择器
    await expect(page.locator('text=分配策略')).toBeVisible()
    await expect(page.locator('select[id="strategy"]')).toBeVisible()
  })

  test('should allocate seats with default strategy', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/exams/*/allocate-seats-with-strategy', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          batchId: 'batch-123',
          totalCandidates: 50,
          totalAssigned: 50,
          totalVenues: 2,
        }),
      })
    })
    
    // 导航到座位分配页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    await page.click('text=座位分配')
    
    // 点击执行分配
    await page.click('button:has-text("执行分配")')
    
    // 确认对话框
    await page.click('button:has-text("确定")')
    
    // 验证成功提示
    await expect(page.locator('text=座位分配成功')).toBeVisible()
  })

  test('should allocate seats with random strategy', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/exams/*/allocate-seats-with-strategy', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          batchId: 'batch-123',
          totalCandidates: 50,
          totalAssigned: 50,
          totalVenues: 2,
          strategy: 'RANDOM',
          strategyDescription: '完全随机分配座位，不考虑岗位',
        }),
      })
    })
    
    // 导航到座位分配页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    await page.click('text=座位分配')
    
    // 显示策略选项
    await page.click('button:has-text("显示策略选项")')
    
    // 选择随机分配策略
    await page.selectOption('select[id="strategy"]', 'RANDOM')
    
    // 点击执行分配
    await page.click('button:has-text("执行分配")')
    
    // 确认对话框
    await page.click('button:has-text("确定")')
    
    // 验证成功提示
    await expect(page.locator('text=座位分配成功')).toBeVisible()
  })

  test('should display venue statistics', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/exams/*/venues', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'venue-1',
              name: '第一考场',
              address: '教学楼A101',
              capacity: 100,
              assignedCount: 80,
            },
            {
              id: 'venue-2',
              name: '第二考场',
              address: '教学楼A102',
              capacity: 100,
              assignedCount: 70,
            },
          ],
          total: 2,
        }),
      })
    })
    
    // 导航到座位分配页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    await page.click('text=座位分配')
    
    // 验证考场统计表格
    await expect(page.locator('text=考场统计')).toBeVisible()
    await expect(page.locator('text=第一考场')).toBeVisible()
    await expect(page.locator('text=第二考场')).toBeVisible()
  })

  test('should display seat assignments list', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/exams/*/seat-assignments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'assignment-1',
            applicationId: 'app-1',
            candidateName: '张三',
            positionTitle: '软件工程师',
            venueName: '第一考场',
            seatNumber: 1,
          },
          {
            id: 'assignment-2',
            applicationId: 'app-2',
            candidateName: '李四',
            positionTitle: '软件工程师',
            venueName: '第一考场',
            seatNumber: 2,
          },
        ]),
      })
    })
    
    // 导航到座位分配页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    await page.click('text=座位分配')
    
    // 验证座位分配明细表格
    await expect(page.locator('text=座位分配明细')).toBeVisible()
    await expect(page.locator('text=张三')).toBeVisible()
    await expect(page.locator('text=李四')).toBeVisible()
  })

  test('should export seat assignments to CSV', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/exams/*/seat-assignments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'assignment-1',
            applicationId: 'app-1',
            candidateName: '张三',
            positionTitle: '软件工程师',
            venueName: '第一考场',
            seatNumber: 1,
          },
        ]),
      })
    })
    
    // 导航到座位分配页面
    await page.goto('/test-tenant/admin/exams/test-exam-id/venues')
    await page.click('text=座位分配')
    
    // 点击导出为CSV
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("导出为 CSV")')
    const download = await downloadPromise
    
    // 验证文件名
    expect(download.suggestedFilename()).toContain('座位分配表')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should create seat map for venue', async ({ page }) => {
    // 导航到座位地图管理页面
    await page.goto('/test-tenant/admin/venues/venue-123/seat-map')
    
    // 填写行列数
    await page.fill('input[id="rows"]', '10')
    await page.fill('input[id="columns"]', '10')
    
    // 点击创建座位地图
    await page.click('button:has-text("创建座位地图")')
    
    // 验证成功提示
    await expect(page.locator('text=座位地图创建成功')).toBeVisible()
  })

  test('should display seat map correctly', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/venues/*/seat-map', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rows: 10,
          columns: 10,
          seats: Array.from({ length: 100 }, (_, i) => ({
            row: Math.floor(i / 10),
            col: i % 10,
            status: 'AVAILABLE',
            label: `${i + 1}`,
          })),
        }),
      })
    })
    
    // 导航到座位地图管理页面
    await page.goto('/test-tenant/admin/venues/venue-123/seat-map')
    
    // 验证座位地图显示
    await expect(page.locator('text=座位布局')).toBeVisible()
    await expect(page.locator('text=10 行 × 10 列')).toBeVisible()
  })

  test('should update seat status on click', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/v1/venues/*/seat-map', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rows: 5,
          columns: 5,
          seats: Array.from({ length: 25 }, (_, i) => ({
            row: Math.floor(i / 5),
            col: i % 5,
            status: 'AVAILABLE',
            label: `${i + 1}`,
          })),
        }),
      })
    })
    
    await page.route('**/api/v1/venues/*/seat-map/seats/*/*/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '座位状态已更新' }),
      })
    })
    
    // 导航到座位地图管理页面
    await page.goto('/test-tenant/admin/venues/venue-123/seat-map')
    
    // 点击座位
    await page.click('.seat-grid .seat:first-child')
    
    // 验证成功提示
    await expect(page.locator('text=座位状态更新成功')).toBeVisible()
  })
})

