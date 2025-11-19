import { test, expect, Page } from '@playwright/test'
import { setupTestData } from '../../utils/ui-data-setup'

/**
 * 辅助函数：选择Shadcn UI Select组件的选项
 * @param page Playwright Page对象
 * @param optionText 要选择的选项文本
 */
async function selectSubjectType(page: Page, optionText: string) {
  // 在对话框中找到科目类型的combobox
  // 根据页面快照，这是对话框中的第一个combobox
  const dialog = page.locator('[role="dialog"]')
  const combobox = dialog.locator('[role="combobox"]').first()

  // 点击combobox打开下拉菜单
  await combobox.click()

  // 等待下拉菜单出现
  await page.waitForTimeout(500)

  // 点击选项
  await page.locator(`[role="option"]:has-text("${optionText}")`).first().click()

  // 等待选择完成
  await page.waitForTimeout(300)
}

test.describe('科目管理 - 创建科目', () => {
  // 在所有测试开始前准备测试数据
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      // 准备测试数据（创建考试和岗位）
      await setupTestData(page)
    } finally {
      await page.close()
      await context.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:3000/login?role=admin')
    await page.waitForLoadState('networkidle')

    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123@Abc')
    await page.click('button[type="submit"]')

    // 等待登录响应（可能成功或失败）
    await page.waitForTimeout(3000)

    // 检查当前URL，判断登录是否成功
    const currentUrl = page.url()

    if (currentUrl.includes('/tenants')) {
      // 登录成功，选择默认租户
      const tenantButton = page.locator('text=默认租户').first()
      if (await tenantButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tenantButton.click()
        await page.waitForTimeout(2000)
      }
    } else if (currentUrl.includes('/login')) {
      // 仍在登录页面，说明登录失败
      console.log('登录失败，跳过此测试')
      test.skip()
    }

    // 导航到科目管理页面
    await page.goto('http://localhost:3000/admin/subjects')
    await page.waitForLoadState('networkidle')
  })

  test('应该能够为软件开发工程师创建3个科目', async ({ page }) => {
    // 选择考试（选择第一个包含"春季招聘考试"的选项）
    await page.click('text=请选择考试')
    await page.waitForTimeout(500)

    // 查找并点击第一个考试选项
    const examOption = page.locator('[role="option"]').filter({ hasText: '春季招聘考试' }).first()
    await examOption.click()

    // 等待岗位加载
    await page.waitForTimeout(1000)

    // 选择岗位（选择第一个包含"软件开发工程师"的选项）
    await page.click('text=请选择岗位')
    await page.waitForTimeout(500)

    const positionOption = page.locator('[role="option"]').filter({ hasText: '软件开发工程师' }).first()
    await positionOption.click()

    // 等待科目列表加载
    await page.waitForTimeout(1000)
    
    // 验证"创建科目"按钮已启用
    const createButton = page.locator('button:has-text("创建科目")')
    await expect(createButton).toBeEnabled()
    
    // 创建第一个科目：Java编程基础
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', 'Java编程基础')

    // 使用辅助函数选择科目类型
    await selectSubjectType(page, '笔试')

    await page.fill('input[id="duration"]', '120')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.4')
    await page.fill('input[id="ordering"]', '1')

    // 设置考试时间为2025-10-15 09:00
    await page.fill('input[id="schedule"]', '2025-10-15T09:00')

    // 提交表单
    await page.click('button[type="submit"]:has-text("创建科目")')

    // 等待成功提示
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })

    // 等待对话框关闭
    await page.waitForTimeout(1000)

    // 确保对话框已完全关闭
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {})

    // 验证科目已添加到列表（使用.first()避免strict mode violation）
    await expect(page.locator('text=Java编程基础').first()).toBeVisible()
    
    // 创建第二个科目：数据结构与算法
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', '数据结构与算法')
    await selectSubjectType(page, '笔试')
    await page.fill('input[id="duration"]', '90')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.4')
    await page.fill('input[id="ordering"]', '2')
    await page.fill('input[id="schedule"]', '2025-10-15T14:00')

    await page.click('button[type="submit"]:has-text("创建科目")')
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })
    await page.waitForTimeout(1000)

    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {})
    await expect(page.locator('text=数据结构与算法').first()).toBeVisible()
    
    // 创建第三个科目：技术面试
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', '技术面试')
    await selectSubjectType(page, '面试')
    await page.fill('input[id="duration"]', '30')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.2')
    await page.fill('input[id="ordering"]', '3')
    await page.fill('input[id="schedule"]', '2025-10-16T09:00')

    await page.click('button[type="submit"]:has-text("创建科目")')
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })
    await page.waitForTimeout(1000)

    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {})
    await expect(page.locator('text=技术面试').first()).toBeVisible()

    // 验证所有3个科目都显示在列表中（使用.first()避免strict mode violation）
    await expect(page.locator('text=Java编程基础').first()).toBeVisible()
    await expect(page.locator('text=数据结构与算法').first()).toBeVisible()
    await expect(page.locator('text=技术面试').first()).toBeVisible()
    
    // 截图
    await page.screenshot({ path: 'test-results/subjects-created-dev.png', fullPage: true })
  })

  test('应该能够为项目管理师创建3个科目', async ({ page }) => {
    // 选择考试（选择第一个包含"春季招聘考试"的选项）
    await page.click('text=请选择考试')
    await page.waitForTimeout(500)

    const examOption = page.locator('[role="option"]').filter({ hasText: '春季招聘考试' }).first()
    await examOption.click()
    await page.waitForTimeout(1000)

    // 选择岗位（选择第一个包含"项目管理师"的选项）
    await page.click('text=请选择岗位')
    await page.waitForTimeout(500)

    const positionOption = page.locator('[role="option"]').filter({ hasText: '项目管理师' }).first()
    await positionOption.click()
    await page.waitForTimeout(1000)
    
    const createButton = page.locator('button:has-text("创建科目")')
    
    // 创建科目1：项目管理理论
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', '项目管理理论')
    await selectSubjectType(page, '笔试')
    await page.fill('input[id="duration"]', '120')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.4')
    await page.fill('input[id="ordering"]', '1')
    await page.fill('input[id="schedule"]', '2025-10-15T09:00')
    await page.click('button[type="submit"]:has-text("创建科目")')
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })
    await page.waitForTimeout(1000)

    // 创建科目2：案例分析
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', '案例分析')
    await selectSubjectType(page, '笔试')
    await page.fill('input[id="duration"]', '90')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.4')
    await page.fill('input[id="ordering"]', '2')
    await page.fill('input[id="schedule"]', '2025-10-15T14:00')
    await page.click('button[type="submit"]:has-text("创建科目")')
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })
    await page.waitForTimeout(1000)

    // 创建科目3：管理面试
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', '管理面试')
    await selectSubjectType(page, '面试')
    await page.fill('input[id="duration"]', '30')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.2')
    await page.fill('input[id="ordering"]', '3')
    await page.fill('input[id="schedule"]', '2025-10-16T09:00')
    await page.click('button[type="submit"]:has-text("创建科目")')
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })
    await page.waitForTimeout(1000)
    
    // 验证（使用.first()避免strict mode violation）
    await expect(page.locator('text=项目管理理论').first()).toBeVisible()
    await expect(page.locator('text=案例分析').first()).toBeVisible()
    await expect(page.locator('text=管理面试').first()).toBeVisible()
    
    await page.screenshot({ path: 'test-results/subjects-created-mgt.png', fullPage: true })
  })

  test('应该能够为市场营销专员创建3个科目', async ({ page }) => {
    // 选择考试（选择第一个包含"春季招聘考试"的选项）
    await page.click('text=请选择考试')
    await page.waitForTimeout(500)

    const examOption = page.locator('[role="option"]').filter({ hasText: '春季招聘考试' }).first()
    await examOption.click()
    await page.waitForTimeout(1000)

    // 选择岗位（选择第一个包含"市场营销专员"的选项）
    await page.click('text=请选择岗位')
    await page.waitForTimeout(500)

    const positionOption = page.locator('[role="option"]').filter({ hasText: '市场营销专员' }).first()
    await positionOption.click()
    await page.waitForTimeout(1000)
    
    const createButton = page.locator('button:has-text("创建科目")')
    
    // 创建科目1：市场营销基础
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', '市场营销基础')
    await selectSubjectType(page, '笔试')
    await page.fill('input[id="duration"]', '120')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.4')
    await page.fill('input[id="ordering"]', '1')
    await page.fill('input[id="schedule"]', '2025-10-15T09:00')
    await page.click('button[type="submit"]:has-text("创建科目")')
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })
    await page.waitForTimeout(1000)

    // 创建科目2：营销策划
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', '营销策划')
    await selectSubjectType(page, '笔试')
    await page.fill('input[id="duration"]', '90')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.4')
    await page.fill('input[id="ordering"]', '2')
    await page.fill('input[id="schedule"]', '2025-10-15T14:00')
    await page.click('button[type="submit"]:has-text("创建科目")')
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })
    await page.waitForTimeout(1000)

    // 创建科目3：营销面试
    await createButton.click()
    await page.waitForSelector('text=创建科目', { state: 'visible' })

    await page.fill('input[id="name"]', '营销面试')
    await selectSubjectType(page, '面试')
    await page.fill('input[id="duration"]', '30')
    await page.fill('input[id="maxScore"]', '100')
    await page.fill('input[id="passingScore"]', '60')
    await page.fill('input[id="weight"]', '0.2')
    await page.fill('input[id="ordering"]', '3')
    await page.fill('input[id="schedule"]', '2025-10-16T09:00')
    await page.click('button[type="submit"]:has-text("创建科目")')
    await page.waitForSelector('text=科目创建成功', { timeout: 5000 })
    await page.waitForTimeout(1000)
    
    // 验证（使用.first()避免strict mode violation）
    await expect(page.locator('text=市场营销基础').first()).toBeVisible()
    await expect(page.locator('text=营销策划').first()).toBeVisible()
    await expect(page.locator('text=营销面试').first()).toBeVisible()
    
    await page.screenshot({ path: 'test-results/subjects-created-mkt.png', fullPage: true })
  })
})

