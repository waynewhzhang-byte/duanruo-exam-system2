import { test, expect } from '@playwright/test'

test.describe('准考证管理流程', () => {
  const tenantSlug = 'test-tenant'
  const examId = 'test-exam-id'

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ user: { id: '1', role: 'ADMIN' } }),
      })
    })
  })

  test.describe('准考证管理页面（管理端）', () => {
    test('应该正确显示准考证管理页面', async ({ page }) => {
      // Mock exam data
      await page.route(`**/api/exams/${examId}`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: examId,
            title: '2024年春季招聘考试',
            status: 'COMPLETED',
          }),
        })
      })

      // Mock tickets
      await page.route(`**/api/exams/${examId}/tickets`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              ticketNo: 'T202401001',
              candidateName: '张三',
              positionTitle: '行政专员',
              venueName: '第一考场',
              roomName: '101教室',
              seatNo: 'A01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: true,
              pdfUrl: '/tickets/1.pdf',
            },
            {
              id: '2',
              ticketNo: 'T202401002',
              candidateName: '李四',
              positionTitle: '技术专员',
              venueName: '第一考场',
              roomName: '102教室',
              seatNo: 'B01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: false,
              pdfUrl: '/tickets/2.pdf',
            },
          ]),
        })
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/tickets`)

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '准考证管理' })).toBeVisible()

      // 验证操作按钮
      await expect(page.getByRole('button', { name: /批量生成/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /批量发布/ })).toBeVisible()

      // 验证统计卡片
      await expect(page.getByText('总准考证数')).toBeVisible()
      await expect(page.getByText('已发布')).toBeVisible()
      await expect(page.getByText('未发布')).toBeVisible()

      // 验证准考证列表
      await expect(page.getByText('张三')).toBeVisible()
      await expect(page.getByText('李四')).toBeVisible()
    })

    test('应该能够批量生成准考证', async ({ page }) => {
      // Mock exam
      await page.route(`**/api/exams/${examId}`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ id: examId, title: '测试考试' }),
        })
      })

      // Mock tickets (empty initially)
      await page.route(`**/api/exams/${examId}/tickets`, (route) => {
        route.fulfill({ status: 200, body: JSON.stringify([]) })
      })

      let generateCalled = false
      await page.route(`**/api/exams/${examId}/tickets/batch-generate`, (route) => {
        if (route.request().method() === 'POST') {
          generateCalled = true
          route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true, count: 10 }),
          })
        } else {
          route.continue()
        }
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/tickets`)

      // 点击批量生成按钮
      await page.getByRole('button', { name: /批量生成/ }).click()

      // 验证API被调用
      await page.waitForTimeout(500)
      expect(generateCalled).toBe(true)
    })

    test('应该能够选择准考证', async ({ page }) => {
      // Mock data
      await page.route(`**/api/exams/${examId}`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ id: examId, title: '测试考试' }),
        })
      })

      await page.route(`**/api/exams/${examId}/tickets`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              ticketNo: 'T001',
              candidateName: '张三',
              positionTitle: '行政专员',
              venueName: '第一考场',
              roomName: '101',
              seatNo: 'A01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: false,
            },
          ]),
        })
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/tickets`)

      // 等待数据加载
      await expect(page.getByText('张三')).toBeVisible()

      // 选择准考证
      const checkbox = page.getByRole('checkbox').nth(1) // 第一个是全选框
      await checkbox.check()

      // 验证批量发布按钮显示数量
      await expect(page.getByRole('button', { name: /批量发布 \(1\)/ })).toBeVisible()
    })

    test('应该能够批量发布准考证', async ({ page }) => {
      // Mock data
      await page.route(`**/api/exams/${examId}`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ id: examId, title: '测试考试' }),
        })
      })

      await page.route(`**/api/exams/${examId}/tickets`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              ticketNo: 'T001',
              candidateName: '张三',
              positionTitle: '行政专员',
              venueName: '第一考场',
              roomName: '101',
              seatNo: 'A01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: false,
              pdfUrl: '/tickets/1.pdf',
            },
          ]),
        })
      })

      let publishCalled = false
      await page.route('**/api/tickets/batch-publish', (route) => {
        if (route.request().method() === 'POST') {
          publishCalled = true
          route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true }),
          })
        } else {
          route.continue()
        }
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/tickets`)

      // 等待数据加载
      await expect(page.getByText('张三')).toBeVisible()

      // 选择准考证
      const checkbox = page.getByRole('checkbox').nth(1)
      await checkbox.check()

      // 点击批量发布
      await page.getByRole('button', { name: /批量发布/ }).click()

      // 验证确认对话框
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/您确定要发布选中的/)).toBeVisible()

      // 确认发布
      await page.getByRole('button', { name: '确认发布' }).click()

      // 验证API被调用
      await page.waitForTimeout(500)
      expect(publishCalled).toBe(true)
    })

    test('应该能够搜索准考证', async ({ page }) => {
      // Mock tickets
      await page.route(`**/api/exams/${examId}/tickets`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              ticketNo: 'T001',
              candidateName: '张三',
              positionTitle: '行政专员',
              venueName: '第一考场',
              roomName: '101',
              seatNo: 'A01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: true,
            },
            {
              id: '2',
              ticketNo: 'T002',
              candidateName: '李四',
              positionTitle: '技术专员',
              venueName: '第一考场',
              roomName: '102',
              seatNo: 'B01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: true,
            },
          ]),
        })
      })

      await page.route('**/api/**', (route) => {
        if (!route.request().url().includes('/tickets')) {
          route.fulfill({ status: 200, body: JSON.stringify({ title: '测试考试' }) })
        } else {
          route.continue()
        }
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/tickets`)

      // 等待数据加载
      await expect(page.getByText('张三')).toBeVisible()
      await expect(page.getByText('李四')).toBeVisible()

      // 搜索
      await page.getByPlaceholder(/搜索/).fill('张三')

      // 验证搜索结果
      await expect(page.getByText('张三')).toBeVisible()
      await page.waitForTimeout(300)
    })
  })

  test.describe('准考证查看页面（考生端）', () => {
    test('应该正确显示准考证列表', async ({ page }) => {
      // Mock tickets
      await page.route('**/api/tickets/my', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              ticketNo: 'T202401001',
              examTitle: '2024年春季招聘考试',
              positionTitle: '行政专员',
              venueName: '第一考场',
              roomName: '101教室',
              seatNo: 'A01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: true,
              pdfUrl: '/tickets/1.pdf',
              qrCode: 'QR_CODE_DATA',
            },
          ]),
        })
      })

      await page.goto(`/${tenantSlug}/candidate/tickets`)

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '我的准考证' })).toBeVisible()

      // 验证准考证信息
      await expect(page.getByText('2024年春季招聘考试')).toBeVisible()
      await expect(page.getByText('行政专员')).toBeVisible()
      await expect(page.getByText('T202401001')).toBeVisible()
      await expect(page.getByText('第一考场')).toBeVisible()
      await expect(page.getByText('101教室')).toBeVisible()
      await expect(page.getByText('A01')).toBeVisible()

      // 验证操作按钮
      await expect(page.getByRole('button', { name: /预览/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /下载/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /打印/ })).toBeVisible()
    })

    test('应该显示暂无准考证提示', async ({ page }) => {
      // Mock empty tickets
      await page.route('**/api/tickets/my', (route) => {
        route.fulfill({ status: 200, body: JSON.stringify([]) })
      })

      await page.goto(`/${tenantSlug}/candidate/tickets`)

      // 验证暂无准考证提示
      await expect(page.getByText('暂无准考证')).toBeVisible()
      await expect(
        page.getByText('您还没有已发布的准考证。请等待管理员发布准考证后再查看。')
      ).toBeVisible()
    })

    test('应该能够预览准考证', async ({ page }) => {
      // Mock tickets
      await page.route('**/api/tickets/my', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              ticketNo: 'T001',
              examTitle: '测试考试',
              positionTitle: '行政专员',
              venueName: '第一考场',
              roomName: '101',
              seatNo: 'A01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: true,
              pdfUrl: '/tickets/1.pdf',
            },
          ]),
        })
      })

      await page.goto(`/${tenantSlug}/candidate/tickets`)

      // 等待数据加载
      await expect(page.getByText('测试考试')).toBeVisible()

      // 点击预览按钮
      await page.getByRole('button', { name: /预览/ }).click()

      // 验证预览对话框
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/准考证预览/)).toBeVisible()
    })

    test('应该能够下载准考证', async ({ page }) => {
      // Mock tickets
      await page.route('**/api/tickets/my', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              ticketNo: 'T001',
              examTitle: '测试考试',
              positionTitle: '行政专员',
              venueName: '第一考场',
              roomName: '101',
              seatNo: 'A01',
              examDate: '2024-03-15',
              examTime: '09:00-11:00',
              isPublished: true,
              pdfUrl: '/tickets/1.pdf',
            },
          ]),
        })
      })

      await page.goto(`/${tenantSlug}/candidate/tickets`)

      // 等待数据加载
      await expect(page.getByText('测试考试')).toBeVisible()

      // 监听下载事件
      const downloadPromise = page.waitForEvent('download')

      // 点击下载按钮
      await page.getByRole('button', { name: /下载/ }).click()

      // 验证下载开始
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.pdf')
    })
  })
})

