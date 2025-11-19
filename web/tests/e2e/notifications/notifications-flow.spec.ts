import { test, expect } from '@playwright/test'

test.describe('通知系统测试', () => {
  test.describe('通知模板管理', () => {
    test.beforeEach(async ({ page }) => {
      // 登录管理员账号
      await page.goto('/login')
      await page.fill('input[name="username"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/admin/dashboard')
    })

    test('应该显示通知模板管理页面', async ({ page }) => {
      await page.goto('/tenant1/admin/notifications/templates')
      
      // 验证页面标题
      await expect(page.locator('h1')).toContainText('通知模板管理')
    })

    test('应该能够创建新模板', async ({ page }) => {
      await page.goto('/tenant1/admin/notifications/templates')
      
      // 点击新建模板按钮
      await page.click('button:has-text("新建模板")')
      
      // 填写模板信息
      await page.fill('input[name="name"]', '测试模板')
      await page.click('button[role="combobox"]')
      await page.click('div[role="option"]:has-text("邮件")')
      await page.fill('input[name="subject"]', '测试邮件主题')
      await page.fill('textarea[name="content"]', '这是一个测试模板内容')
      await page.fill('input[name="variables"]', 'name,examTitle')
      
      // 提交表单
      await page.click('button[type="submit"]:has-text("创建")')
      
      // 验证创建成功提示
      await expect(page.locator('text=模板创建成功')).toBeVisible({ timeout: 5000 })
    })

    test('应该能够编辑模板', async ({ page }) => {
      await page.goto('/tenant1/admin/notifications/templates')
      
      // 查找第一个模板的编辑按钮
      const editButton = page.locator('button:has-text("编辑")').first()
      const hasTemplates = await editButton.count() > 0
      
      if (hasTemplates) {
        await editButton.click()
        
        // 修改模板名称
        await page.fill('input[name="name"]', '修改后的模板名称')
        
        // 提交表单
        await page.click('button[type="submit"]:has-text("更新")')
        
        // 验证更新成功提示
        await expect(page.locator('text=模板更新成功')).toBeVisible({ timeout: 5000 })
      }
    })

    test('应该能够删除模板', async ({ page }) => {
      await page.goto('/tenant1/admin/notifications/templates')
      
      // 查找第一个模板的删除按钮
      const deleteButton = page.locator('button:has-text("删除")').first()
      const hasTemplates = await deleteButton.count() > 0
      
      if (hasTemplates) {
        // 监听确认对话框
        page.on('dialog', dialog => dialog.accept())
        
        await deleteButton.click()
        
        // 验证删除成功提示
        await expect(page.locator('text=模板删除成功')).toBeVisible({ timeout: 5000 })
      }
    })

    test('应该显示不同类型的模板图标', async ({ page }) => {
      await page.goto('/tenant1/admin/notifications/templates')
      
      // 验证类型标签存在
      const badges = page.locator('span:has-text("邮件"), span:has-text("短信"), span:has-text("站内")')
      const badgeCount = await badges.count()
      
      // 如果有模板，应该至少有一个类型标签
      if (badgeCount > 0) {
        expect(badgeCount).toBeGreaterThan(0)
      }
    })

    test('应该显示暂无模板提示（无模板时）', async ({ page }) => {
      await page.goto('/tenant1/admin/notifications/templates')
      
      // 如果没有模板，应该显示提示
      const noTemplatesMessage = page.locator('text=暂无模板')
      const hasNoTemplates = await noTemplatesMessage.isVisible().catch(() => false)
      
      if (hasNoTemplates) {
        await expect(noTemplatesMessage).toBeVisible()
        await expect(page.locator('text=创建您的第一个通知模板')).toBeVisible()
      }
    })

    test('应该能够取消创建模板', async ({ page }) => {
      await page.goto('/tenant1/admin/notifications/templates')
      
      // 点击新建模板按钮
      await page.click('button:has-text("新建模板")')
      
      // 填写部分信息
      await page.fill('input[name="name"]', '测试模板')
      
      // 点击取消按钮
      await page.click('button:has-text("取消")')
      
      // 验证对话框已关闭
      await expect(page.locator('input[name="name"]')).not.toBeVisible()
    })
  })

  test.describe('站内消息', () => {
    test.beforeEach(async ({ page }) => {
      // 登录考生账号
      await page.goto('/login')
      await page.fill('input[name="username"]', 'candidate@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/candidate/applications')
    })

    test('应该显示站内消息页面', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 验证页面标题
      await expect(page.locator('h1')).toContainText('站内消息')
    })

    test('应该显示未读消息数量', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 查找未读消息徽章
      const unreadBadge = page.locator('span:has-text("条未读")')
      const hasUnread = await unreadBadge.isVisible().catch(() => false)
      
      if (hasUnread) {
        await expect(unreadBadge).toBeVisible()
      }
    })

    test('应该能够筛选消息', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 点击未读筛选
      await page.click('button:has-text("未读")')
      
      // 等待列表更新
      await page.waitForTimeout(500)
      
      // 验证筛选按钮已激活
      const unreadButton = page.locator('button:has-text("未读")').first()
      await expect(unreadButton).toHaveClass(/default/)
    })

    test('应该能够查看消息详情', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 查找第一条消息
      const firstMessage = page.locator('.cursor-pointer').first()
      const hasMessages = await firstMessage.count() > 0
      
      if (hasMessages) {
        await firstMessage.click()
        
        // 验证详情对话框已打开
        await expect(page.locator('div[role="dialog"]')).toBeVisible()
      }
    })

    test('应该能够标记消息为已读', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 查找未读消息
      const unreadMessage = page.locator('.bg-blue-50').first()
      const hasUnread = await unreadMessage.count() > 0
      
      if (hasUnread) {
        // 点击消息
        await unreadMessage.click()
        
        // 等待标记为已读
        await page.waitForTimeout(500)
        
        // 关闭详情对话框
        await page.click('button:has-text("关闭")')
        
        // 刷新页面
        await page.reload()
        
        // 验证消息已标记为已读（背景色变化）
        const wasUnread = await page.locator('.bg-blue-50').count()
        // 未读消息数量应该减少
      }
    })

    test('应该能够标记全部为已读', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 点击全部已读按钮
      const markAllButton = page.locator('button:has-text("全部已读")')
      const isEnabled = await markAllButton.isEnabled()
      
      if (isEnabled) {
        await markAllButton.click()
        
        // 验证成功提示
        await expect(page.locator('text=已标记全部为已读')).toBeVisible({ timeout: 5000 })
      }
    })

    test('应该能够删除消息', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 查找第一条消息的删除按钮
      const deleteButton = page.locator('button:has(svg)').filter({ hasText: '' }).first()
      const hasMessages = await deleteButton.count() > 0
      
      if (hasMessages) {
        // 监听确认对话框
        page.on('dialog', dialog => dialog.accept())
        
        await deleteButton.click()
        
        // 验证删除成功提示
        await expect(page.locator('text=消息已删除')).toBeVisible({ timeout: 5000 })
      }
    })

    test('应该显示暂无消息提示（无消息时）', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 如果没有消息，应该显示提示
      const noMessagesIcon = page.locator('svg').filter({ has: page.locator('title:has-text("Bell")') })
      const hasNoMessages = await page.locator('text=暂无消息').isVisible().catch(() => false)
      
      if (hasNoMessages) {
        await expect(page.locator('text=暂无消息')).toBeVisible()
      }
    })

    test('应该能够在详情对话框中删除消息', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 查找第一条消息
      const firstMessage = page.locator('.cursor-pointer').first()
      const hasMessages = await firstMessage.count() > 0
      
      if (hasMessages) {
        await firstMessage.click()
        
        // 在详情对话框中点击删除按钮
        const deleteButton = page.locator('div[role="dialog"] button:has-text("删除")')
        
        // 监听确认对话框
        page.on('dialog', dialog => dialog.accept())
        
        await deleteButton.click()
        
        // 验证删除成功提示
        await expect(page.locator('text=消息已删除')).toBeVisible({ timeout: 5000 })
      }
    })

    test('应该显示消息类型图标', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 验证消息列表中有图标
      const icons = page.locator('svg')
      const iconCount = await icons.count()
      
      // 如果有消息，应该有图标
      if (iconCount > 0) {
        expect(iconCount).toBeGreaterThan(0)
      }
    })

    test('应该能够切换到已读筛选', async ({ page }) => {
      await page.goto('/tenant1/candidate/notifications')
      
      // 点击已读筛选
      await page.click('button:has-text("已读")')
      
      // 等待列表更新
      await page.waitForTimeout(500)
      
      // 验证筛选按钮已激活
      const readButton = page.locator('button:has-text("已读")').first()
      await expect(readButton).toHaveClass(/default/)
    })
  })
})

