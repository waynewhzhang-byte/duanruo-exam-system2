import { test, expect } from '@playwright/test'

test.describe('数据分析功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录管理员账号
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin/dashboard')
  })

  test.describe('考试数据分析', () => {
    test('应该显示考试数据分析页面', async ({ page }) => {
      // 假设有一个考试ID
      const examId = '1'
      await page.goto(`/tenant1/admin/exams/${examId}/analytics`)
      
      // 验证页面标题
      await expect(page.locator('h1')).toContainText('考试数据分析')
    })

    test('应该显示统计卡片', async ({ page }) => {
      const examId = '1'
      await page.goto(`/tenant1/admin/exams/${examId}/analytics`)
      
      // 验证统计卡片
      await expect(page.locator('text=总报名数')).toBeVisible()
      await expect(page.locator('text=已通过')).toBeVisible()
      await expect(page.locator('text=已拒绝')).toBeVisible()
      await expect(page.locator('text=待审核')).toBeVisible()
    })

    test('应该显示报名趋势图表', async ({ page }) => {
      const examId = '1'
      await page.goto(`/tenant1/admin/exams/${examId}/analytics`)
      
      // 点击报名趋势标签
      await page.click('button[value="trend"]')
      
      // 验证图表标题
      await expect(page.locator('text=报名趋势（最近14天）')).toBeVisible()
    })

    test('应该显示岗位热度图表', async ({ page }) => {
      const examId = '1'
      await page.goto(`/tenant1/admin/exams/${examId}/analytics`)
      
      // 点击岗位热度标签
      await page.click('button[value="position"]')
      
      // 验证图表标题
      await expect(page.locator('text=岗位热度（前10名）')).toBeVisible()
    })

    test('应该显示状态分布图表', async ({ page }) => {
      const examId = '1'
      await page.goto(`/tenant1/admin/exams/${examId}/analytics`)
      
      // 点击状态分布标签
      await page.click('button[value="status"]')
      
      // 验证图表标题
      await expect(page.locator('text=报名状态分布')).toBeVisible()
    })

    test('应该显示竞争比例图表', async ({ page }) => {
      const examId = '1'
      await page.goto(`/tenant1/admin/exams/${examId}/analytics`)
      
      // 点击竞争比例标签
      await page.click('button[value="competition"]')
      
      // 验证图表标题
      await expect(page.locator('text=岗位竞争比例（前10名）')).toBeVisible()
    })
  })

  test.describe('岗位数据分析', () => {
    test('应该显示岗位数据分析页面', async ({ page }) => {
      const positionId = '1'
      await page.goto(`/tenant1/admin/positions/${positionId}/analytics`)
      
      // 验证页面标题
      await expect(page.locator('h1')).toContainText('岗位数据分析')
    })

    test('应该显示岗位统计卡片', async ({ page }) => {
      const positionId = '1'
      await page.goto(`/tenant1/admin/positions/${positionId}/analytics`)
      
      // 验证统计卡片
      await expect(page.locator('text=总报名数')).toBeVisible()
      await expect(page.locator('text=竞争比例')).toBeVisible()
      await expect(page.locator('text=审核通过率')).toBeVisible()
      await expect(page.locator('text=审核拒绝率')).toBeVisible()
    })

    test('应该显示审核状态分布图表', async ({ page }) => {
      const positionId = '1'
      await page.goto(`/tenant1/admin/positions/${positionId}/analytics`)
      
      // 验证图表标题
      await expect(page.locator('text=审核状态分布')).toBeVisible()
    })

    test('应该显示性别分布图表', async ({ page }) => {
      const positionId = '1'
      await page.goto(`/tenant1/admin/positions/${positionId}/analytics`)
      
      // 验证图表标题
      await expect(page.locator('text=性别分布')).toBeVisible()
    })

    test('应该显示学历分布图表', async ({ page }) => {
      const positionId = '1'
      await page.goto(`/tenant1/admin/positions/${positionId}/analytics`)
      
      // 验证图表标题
      await expect(page.locator('text=学历分布')).toBeVisible()
    })

    test('应该显示年龄分布图表', async ({ page }) => {
      const positionId = '1'
      await page.goto(`/tenant1/admin/positions/${positionId}/analytics`)
      
      // 验证图表标题
      await expect(page.locator('text=年龄分布')).toBeVisible()
    })

    test('应该显示竞争激烈标签', async ({ page }) => {
      const positionId = '1'
      await page.goto(`/tenant1/admin/positions/${positionId}/analytics`)
      
      // 验证竞争比例卡片中的标签
      const competitionCard = page.locator('text=竞争比例').locator('..')
      const badge = competitionCard.locator('span')
      
      // 标签应该显示"竞争激烈"或"竞争适中"
      const badgeText = await badge.textContent()
      expect(badgeText).toMatch(/竞争激烈|竞争适中/)
    })
  })

  test.describe('报名数据分析', () => {
    test('应该显示报名数据分析页面', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 验证页面标题
      await expect(page.locator('h1')).toContainText('报名数据分析')
    })

    test('应该显示统计卡片', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 验证统计卡片
      await expect(page.locator('text=总报名数')).toBeVisible()
      await expect(page.locator('text=草稿数')).toBeVisible()
      await expect(page.locator('text=已提交')).toBeVisible()
      await expect(page.locator('text=已通过')).toBeVisible()
    })

    test('应该能够切换时间范围', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 点击时间范围选择器
      await page.click('button[role="combobox"]')
      
      // 选择"最近7天"
      await page.click('div[role="option"]:has-text("最近7天")')
      
      // 等待数据更新
      await page.waitForTimeout(500)
      
      // 验证选择器已更新
      await expect(page.locator('button[role="combobox"]')).toContainText('最近7天')
    })

    test('应该显示报名时间趋势图表', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 验证图表标题
      await expect(page.locator('text=报名时间趋势')).toBeVisible()
    })

    test('应该显示状态分布图表', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 验证图表标题
      await expect(page.locator('text=状态分布')).toBeVisible()
    })

    test('应该显示按小时分布图表', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 验证图表标题
      await expect(page.locator('text=按小时分布')).toBeVisible()
    })

    test('应该显示按星期分布图表', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 验证图表标题
      await expect(page.locator('text=按星期分布')).toBeVisible()
    })

    test('应该能够切换到最近30天', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 点击时间范围选择器
      await page.click('button[role="combobox"]')
      
      // 选择"最近30天"
      await page.click('div[role="option"]:has-text("最近30天")')
      
      // 等待数据更新
      await page.waitForTimeout(500)
      
      // 验证选择器已更新
      await expect(page.locator('button[role="combobox"]')).toContainText('最近30天')
    })

    test('应该能够切换到全部时间', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 点击时间范围选择器
      await page.click('button[role="combobox"]')
      
      // 选择"全部时间"
      await page.click('div[role="option"]:has-text("全部时间")')
      
      // 等待数据更新
      await page.waitForTimeout(500)
      
      // 验证选择器已更新
      await expect(page.locator('button[role="combobox"]')).toContainText('全部时间')
    })
  })

  test.describe('数据可视化', () => {
    test('应该正确渲染图表', async ({ page }) => {
      await page.goto('/tenant1/admin/analytics/applications')
      
      // 等待图表加载
      await page.waitForTimeout(1000)
      
      // 验证图表容器存在
      const charts = await page.locator('.recharts-wrapper').count()
      expect(charts).toBeGreaterThan(0)
    })

    test('应该显示暂无数据提示（无数据时）', async ({ page }) => {
      // 假设这个考试没有报名数据
      const examId = '999'
      await page.goto(`/tenant1/admin/exams/${examId}/analytics`)
      
      // 点击报名趋势标签
      await page.click('button[value="trend"]')
      
      // 验证暂无数据提示
      await expect(page.locator('text=暂无报名数据')).toBeVisible()
    })
  })
})

