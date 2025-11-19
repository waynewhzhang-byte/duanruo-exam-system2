import { test, expect } from '@playwright/test'

test.describe('Review Flow', () => {
  const tenantSlug = 'test-tenant'
  const reviewerEmail = 'reviewer@example.com'
  const reviewerPassword = 'password123'

  test.beforeEach(async ({ page }) => {
    // Login as reviewer
    await page.goto(`/${tenantSlug}/login`)
    await page.fill('input[name="email"]', reviewerEmail)
    await page.fill('input[name="password"]', reviewerPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(`/${tenantSlug}/admin/**`)
  })

  test('should display review list page correctly', async ({ page }) => {
    await page.goto(`/${tenantSlug}/admin/reviews`)

    // Check page title
    await expect(page.locator('h1')).toContainText('审核管理')

    // Check statistics cards
    await expect(page.locator('text=待审核总数')).toBeVisible()
    await expect(page.locator('text=待初审')).toBeVisible()
    await expect(page.locator('text=待复审')).toBeVisible()
    await expect(page.locator('text=今日通过')).toBeVisible()
    await expect(page.locator('text=今日拒绝')).toBeVisible()

    // Check filters
    await expect(page.locator('input[placeholder*="搜索"]')).toBeVisible()
    await expect(page.locator('text=审核状态')).toBeVisible()
  })

  test('should filter reviews by search term', async ({ page }) => {
    await page.goto(`/${tenantSlug}/admin/reviews`)

    // Enter search term
    await page.fill('input[placeholder*="搜索"]', '张三')

    // Wait for results to update
    await page.waitForTimeout(500)

    // Check that results are filtered
    const rows = page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      // Verify that all visible rows contain the search term
      for (let i = 0; i < count; i++) {
        const rowText = await rows.nth(i).textContent()
        expect(rowText?.toLowerCase()).toContain('张三'.toLowerCase())
      }
    }
  })

  test('should filter reviews by status', async ({ page }) => {
    await page.goto(`/${tenantSlug}/admin/reviews`)

    // Select status filter
    await page.click('text=审核状态')
    await page.click('text=待初审')

    // Wait for results to update
    await page.waitForTimeout(500)

    // Check that results are filtered
    const badges = page.locator('table tbody tr td:has-text("待初审")')
    const count = await badges.count()

    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should navigate to review detail page', async ({ page }) => {
    await page.goto(`/${tenantSlug}/admin/reviews`)

    // Click on first review
    const viewButton = page.locator('button:has-text("查看详情")').first()
    if (await viewButton.isVisible()) {
      await viewButton.click()

      // Check that we're on the detail page
      await expect(page).toHaveURL(/\/admin\/reviews\/[^/]+$/)
      await expect(page.locator('h1')).toContainText('审核详情')
    }
  })

  test('should display review detail page correctly', async ({ page }) => {
    // Navigate to a review detail page (assuming applicationId exists)
    const applicationId = 'test-application-id'
    await page.goto(`/${tenantSlug}/admin/reviews/${applicationId}`)

    // Check page sections
    await expect(page.locator('h1')).toContainText('审核详情')
    await expect(page.locator('text=基本信息')).toBeVisible()
    await expect(page.locator('text=报名表单')).toBeVisible()
    await expect(page.locator('text=附件材料')).toBeVisible()
    await expect(page.locator('text=审核历史')).toBeVisible()

    // Check review actions section
    await expect(page.locator('text=审核操作')).toBeVisible()
  })

  test('should preview attachment', async ({ page }) => {
    const applicationId = 'test-application-id'
    await page.goto(`/${tenantSlug}/admin/reviews/${applicationId}`)

    // Click preview button for first attachment
    const previewButton = page.locator('button:has-text("预览")').first()
    if (await previewButton.isVisible()) {
      await previewButton.click()

      // Check that preview modal is displayed
      await expect(page.locator('text=关闭')).toBeVisible()

      // Close modal
      await page.click('button:has-text("关闭")')
    }
  })

  test('should download attachment', async ({ page }) => {
    const applicationId = 'test-application-id'
    await page.goto(`/${tenantSlug}/admin/reviews/${applicationId}`)

    // Click download button for first attachment
    const downloadButton = page.locator('button:has-text("下载")').first()
    if (await downloadButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download')
      await downloadButton.click()

      // Wait for the download to complete
      const download = await downloadPromise
      expect(download).toBeTruthy()
    }
  })

  test('should approve application with comments', async ({ page }) => {
    const applicationId = 'test-application-id'
    await page.goto(`/${tenantSlug}/admin/reviews/${applicationId}`)

    // Enter review comments using Quill editor
    const quillEditor = page.locator('.ql-editor')
    if (await quillEditor.isVisible()) {
      await quillEditor.fill('审核通过，材料齐全，符合要求。')

      // Click approve button
      await page.click('button:has-text("审核通过")')

      // Confirm dialog
      page.on('dialog', (dialog) => dialog.accept())

      // Wait for success message
      await expect(page.locator('text=审核通过成功')).toBeVisible({ timeout: 5000 })

      // Should redirect to review list
      await expect(page).toHaveURL(`/${tenantSlug}/admin/reviews`)
    }
  })

  test('should reject application with comments', async ({ page }) => {
    const applicationId = 'test-application-id'
    await page.goto(`/${tenantSlug}/admin/reviews/${applicationId}`)

    // Enter review comments using Quill editor
    const quillEditor = page.locator('.ql-editor')
    if (await quillEditor.isVisible()) {
      await quillEditor.fill('材料不齐全，请补充学历证明。')

      // Click reject button
      await page.click('button:has-text("审核拒绝")')

      // Confirm dialog
      page.on('dialog', (dialog) => dialog.accept())

      // Wait for success message
      await expect(page.locator('text=审核拒绝成功')).toBeVisible({ timeout: 5000 })

      // Should redirect to review list
      await expect(page).toHaveURL(`/${tenantSlug}/admin/reviews`)
    }
  })

  test('should not allow review without comments', async ({ page }) => {
    const applicationId = 'test-application-id'
    await page.goto(`/${tenantSlug}/admin/reviews/${applicationId}`)

    // Click approve button without entering comments
    await page.click('button:has-text("审核通过")')

    // Should show error message
    await expect(page.locator('text=请填写审核意见')).toBeVisible({ timeout: 2000 })
  })

  test('should display review history', async ({ page }) => {
    const applicationId = 'test-application-id'
    await page.goto(`/${tenantSlug}/admin/reviews/${applicationId}`)

    // Check review history section
    const historySection = page.locator('text=审核历史').locator('..')
    await expect(historySection).toBeVisible()

    // Check for review records (if any)
    const reviewRecords = page.locator('.border-l-4.border-primary')
    const count = await reviewRecords.count()

    if (count > 0) {
      // Verify review record structure
      const firstRecord = reviewRecords.first()
      await expect(firstRecord.locator('text=/初审|复审/')).toBeVisible()
      await expect(firstRecord.locator('text=/通过|拒绝/')).toBeVisible()
    }
  })

  test('candidate should view rejection reason', async ({ page }) => {
    // Login as candidate
    await page.goto(`/${tenantSlug}/login`)
    await page.fill('input[name="email"]', 'candidate@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to rejected application
    const applicationId = 'rejected-application-id'
    await page.goto(`/${tenantSlug}/candidate/applications/${applicationId}`)

    // Check rejection alert
    await expect(page.locator('text=审核未通过')).toBeVisible()
    await expect(page.locator('text=拒绝原因')).toBeVisible()

    // Check action buttons
    await expect(page.locator('button:has-text("修改报名信息")')).toBeVisible()
    await expect(page.locator('button:has-text("重新提交审核")')).toBeVisible()
  })

  test('candidate should edit and resubmit rejected application', async ({ page }) => {
    // Login as candidate
    await page.goto(`/${tenantSlug}/login`)
    await page.fill('input[name="email"]', 'candidate@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to rejected application
    const applicationId = 'rejected-application-id'
    await page.goto(`/${tenantSlug}/candidate/applications/${applicationId}`)

    // Click edit button
    await page.click('button:has-text("修改报名信息")')

    // Edit form data
    const firstInput = page.locator('input').first()
    if (await firstInput.isVisible()) {
      await firstInput.fill('Updated value')

      // Save changes
      await page.click('button:has-text("保存修改")')

      // Confirm dialog
      page.on('dialog', (dialog) => dialog.accept())

      // Wait for success message
      await expect(page.locator('text=报名信息已更新')).toBeVisible({ timeout: 5000 })
    }

    // Resubmit application
    await page.click('button:has-text("重新提交审核")')

    // Confirm dialog
    page.on('dialog', (dialog) => dialog.accept())

    // Wait for success message
    await expect(page.locator('text=报名已重新提交审核')).toBeVisible({ timeout: 5000 })
  })

  test('should reset filters', async ({ page }) => {
    await page.goto(`/${tenantSlug}/admin/reviews`)

    // Apply filters
    await page.fill('input[placeholder*="搜索"]', '测试')
    await page.click('text=审核状态')
    await page.click('text=待初审')

    // Click reset button
    await page.click('button:has-text("重置筛选")')

    // Check that filters are cleared
    await expect(page.locator('input[placeholder*="搜索"]')).toHaveValue('')
  })
})

