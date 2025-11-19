import { test, expect } from '@playwright/test'

test.describe('报名流程测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录考生账号
    await page.goto('/login')
    await page.fill('input[name="username"]', 'candidate@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/candidate/applications')
  })

  test('应该显示报名列表页面', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 验证页面标题
    await expect(page.locator('h1')).toContainText('我的报名')
    
    // 验证新建报名按钮
    await expect(page.locator('button:has-text("新建报名")')).toBeVisible()
  })

  test('应该显示报名号码列', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 验证表头包含报名号
    await expect(page.locator('th:has-text("报名号")')).toBeVisible()
  })

  test('应该显示报名进度条', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 验证表头包含进度列
    await expect(page.locator('th:has-text("进度")')).toBeVisible()
    
    // 如果有报名记录，验证进度条存在
    const hasApplications = await page.locator('table tbody tr').count() > 0
    if (hasApplications) {
      await expect(page.locator('.bg-gray-200.rounded-full.h-2').first()).toBeVisible()
    }
  })

  test('应该能够创建新报名', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 点击新建报名按钮
    await page.click('button:has-text("新建报名")')
    
    // 验证跳转到新建报名页面
    await expect(page).toHaveURL(/\/candidate\/applications\/new/)
    
    // 验证页面标题
    await expect(page.locator('h1')).toContainText('新建报名')
  })

  test('应该能够保存草稿', async ({ page }) => {
    await page.goto('/candidate/applications/new')
    
    // 选择考试
    await page.click('button:has-text("选择考试")')
    await page.click('div[role="option"]:first-child')
    
    // 选择岗位
    await page.click('button:has-text("选择岗位")')
    await page.click('div[role="option"]:first-child')
    
    // 填写基本信息
    await page.fill('input[name="fullName"]', '测试考生')
    await page.fill('input[name="idNumber"]', '110101199001011234')
    await page.fill('input[name="phone"]', '13800138000')
    await page.fill('input[name="email"]', 'test@example.com')
    
    // 点击保存草稿按钮
    await page.click('button:has-text("保存草稿")')
    
    // 验证保存成功提示
    await expect(page.locator('text=草稿保存成功')).toBeVisible({ timeout: 5000 })
  })

  test('应该显示草稿自动保存状态', async ({ page }) => {
    // 先创建一个草稿
    await page.goto('/candidate/applications/new')
    
    // 选择考试和岗位
    await page.click('button:has-text("选择考试")')
    await page.click('div[role="option"]:first-child')
    await page.click('button:has-text("选择岗位")')
    await page.click('div[role="option"]:first-child')
    
    // 保存草稿
    await page.fill('input[name="fullName"]', '测试考生')
    await page.click('button:has-text("保存草稿")')
    await page.waitForSelector('text=草稿保存成功')
    
    // 获取草稿ID
    const url = page.url()
    const draftId = new URL(url).searchParams.get('draftId')
    
    if (draftId) {
      // 修改表单内容
      await page.fill('input[name="phone"]', '13900139000')
      
      // 等待自动保存
      await page.waitForTimeout(2000)
      
      // 验证保存状态提示
      const savingText = page.locator('text=保存中...')
      const savedText = page.locator('text=已保存')
      
      // 应该显示"保存中..."或"已保存"
      const isSaving = await savingText.isVisible().catch(() => false)
      const isSaved = await savedText.isVisible().catch(() => false)
      
      expect(isSaving || isSaved).toBeTruthy()
    }
  })

  test('应该能够继续编辑草稿', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 查找草稿状态的报名
    const draftRow = page.locator('tr:has(span:has-text("草稿"))').first()
    const hasDraft = await draftRow.count() > 0
    
    if (hasDraft) {
      // 点击继续编辑按钮
      await draftRow.locator('button:has-text("继续编辑")').click()
      
      // 验证跳转到编辑页面
      await expect(page).toHaveURL(/\/candidate\/applications\/new\?.*draftId=/)
      
      // 验证页面标题
      await expect(page.locator('h1')).toContainText('新建报名')
    }
  })

  test('应该能够提交报名', async ({ page }) => {
    await page.goto('/candidate/applications/new')
    
    // 选择考试和岗位
    await page.click('button:has-text("选择考试")')
    await page.click('div[role="option"]:first-child')
    await page.click('button:has-text("选择岗位")')
    await page.click('div[role="option"]:first-child')
    
    // 填写完整的报名信息
    await page.fill('input[name="fullName"]', '测试考生')
    await page.fill('input[name="idNumber"]', '110101199001011234')
    await page.fill('input[name="phone"]', '13800138000')
    await page.fill('input[name="email"]', 'test@example.com')
    
    // 选择性别
    await page.click('button[role="combobox"]:has-text("选择性别")')
    await page.click('div[role="option"]:has-text("男")')
    
    // 填写出生日期
    await page.fill('input[name="birthDate"]', '1990-01-01')
    
    // 填写地址
    await page.fill('input[name="address"]', '北京市朝阳区')
    
    // 填写紧急联系人
    await page.fill('input[name="emergencyContactName"]', '张三')
    await page.fill('input[name="emergencyContactPhone"]', '13900139000')
    await page.fill('input[name="emergencyContactRelation"]', '父亲')
    
    // 填写教育背景
    await page.fill('input[name="educationBackgrounds.0.school"]', '北京大学')
    await page.fill('input[name="educationBackgrounds.0.major"]', '计算机科学')
    await page.fill('input[name="educationBackgrounds.0.startDate"]', '2008-09-01')
    await page.fill('input[name="educationBackgrounds.0.endDate"]', '2012-06-30')
    
    // 同意条款
    await page.check('input[name="agreeToTerms"]')
    await page.check('input[name="agreeToPrivacy"]')
    
    // 提交报名
    await page.click('button:has-text("提交报名")')
    
    // 验证提交成功
    await expect(page.locator('text=报名提交成功')).toBeVisible({ timeout: 5000 })
  })

  test('应该能够查看报名详情', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 查找已提交的报名
    const applicationRow = page.locator('tr:has(span:has-text("已提交"))').first()
    const hasApplication = await applicationRow.count() > 0
    
    if (hasApplication) {
      // 点击查看详情按钮
      await applicationRow.locator('button:has-text("查看详情")').click()
      
      // 验证跳转到详情页面
      await expect(page).toHaveURL(/\/candidate\/applications\/\d+/)
    }
  })

  test('应该能够搜索和筛选报名', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 测试状态筛选
    await page.selectOption('select', { label: '草稿' })
    
    // 等待列表更新
    await page.waitForTimeout(500)
    
    // 验证筛选结果（如果有数据）
    const rows = await page.locator('table tbody tr').count()
    if (rows > 0) {
      // 所有行应该显示草稿状态
      await expect(page.locator('span:has-text("草稿")').first()).toBeVisible()
    }
  })

  test('应该能够按提交时间排序', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 选择升序排序
    await page.selectOption('select[value="submittedAt,desc"]', { label: '提交时间 升序' })
    
    // 等待列表更新
    await page.waitForTimeout(500)
    
    // 验证排序选择器已更新
    await expect(page.locator('select[value="submittedAt,asc"]')).toBeVisible()
  })

  test('应该显示不同状态的进度百分比', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 验证不同状态的进度条
    const rows = await page.locator('table tbody tr').count()
    
    if (rows > 0) {
      // 获取第一行的进度百分比
      const progressText = await page.locator('table tbody tr:first-child td:has-text("%")').textContent()
      
      // 验证百分比格式
      expect(progressText).toMatch(/\d+%/)
    }
  })

  test('应该能够查看准考证（已通过审核）', async ({ page }) => {
    await page.goto('/candidate/applications')
    
    // 查找已通过审核的报名
    const approvedRow = page.locator('tr:has(span:has-text("已通过"))').first()
    const hasApproved = await approvedRow.count() > 0
    
    if (hasApproved) {
      // 点击查看准考证按钮
      await approvedRow.locator('button:has-text("查看准考证")').click()
      
      // 验证跳转到准考证页面
      await expect(page).toHaveURL(/\/candidate\/tickets/)
    }
  })
})

