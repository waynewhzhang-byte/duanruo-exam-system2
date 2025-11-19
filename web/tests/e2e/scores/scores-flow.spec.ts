import { test, expect } from '@playwright/test'

test.describe('成绩管理流程', () => {
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

  test.describe('成绩录入页面', () => {
    test('应该正确显示成绩录入页面', async ({ page }) => {
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

      // Mock subjects
      await page.route(`**/api/exams/${examId}/subjects`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: '1', name: '行政能力测试', code: 'XC', totalScore: 100 },
            { id: '2', name: '申论', code: 'SL', totalScore: 100 },
          ]),
        })
      })

      // Mock applications
      await page.route(`**/api/exams/${examId}/applications`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              applicationNo: 'APP001',
              candidateName: '张三',
              positionTitle: '行政专员',
            },
          ]),
        })
      })

      // Mock scores
      await page.route(`**/api/exams/${examId}/scores`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([]),
        })
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/scores`)

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '成绩管理' })).toBeVisible()

      // 验证操作按钮
      await expect(page.getByRole('button', { name: /下载模板/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /导出成绩/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /批量导入/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /录入成绩/ })).toBeVisible()
    })

    test('应该能够打开录入成绩对话框', async ({ page }) => {
      await page.route('**/api/**', (route) => {
        route.fulfill({ status: 200, body: JSON.stringify([]) })
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/scores`)

      // 点击录入成绩按钮
      await page.getByRole('button', { name: /录入成绩/ }).click()

      // 验证对话框显示
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText('录入成绩')).toBeVisible()
      await expect(page.getByText('选择考生')).toBeVisible()
      await expect(page.getByText('选择科目')).toBeVisible()
      await expect(page.getByText('分数')).toBeVisible()
    })

    test('应该能够录入成绩', async ({ page }) => {
      // Mock data
      await page.route(`**/api/exams/${examId}`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ id: examId, title: '测试考试' }),
        })
      })

      await page.route(`**/api/exams/${examId}/subjects`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: '1', name: '行政能力测试', code: 'XC', totalScore: 100 },
          ]),
        })
      })

      await page.route(`**/api/exams/${examId}/applications`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              applicationNo: 'APP001',
              candidateName: '张三',
              positionTitle: '行政专员',
            },
          ]),
        })
      })

      await page.route(`**/api/exams/${examId}/scores`, (route) => {
        route.fulfill({ status: 200, body: JSON.stringify([]) })
      })

      let scoreSubmitted = false
      await page.route('**/api/scores', (route) => {
        if (route.request().method() === 'POST') {
          scoreSubmitted = true
          route.fulfill({
            status: 200,
            body: JSON.stringify({ id: '1', score: 85 }),
          })
        } else {
          route.continue()
        }
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/scores`)

      // 打开对话框
      await page.getByRole('button', { name: /录入成绩/ }).click()

      // 选择考生
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: /张三/ }).click()

      // 选择科目
      await page.getByRole('combobox').last().click()
      await page.getByRole('option', { name: /行政能力测试/ }).click()

      // 输入分数
      await page.getByPlaceholder('请输入分数').fill('85')

      // 提交
      await page.getByRole('button', { name: '确定' }).click()

      // 验证提交成功
      await page.waitForTimeout(500)
      expect(scoreSubmitted).toBe(true)
    })

    test('应该能够搜索成绩', async ({ page }) => {
      // Mock scores
      await page.route(`**/api/exams/${examId}/scores`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              candidateName: '张三',
              positionTitle: '行政专员',
              subjectName: '行政能力测试',
              score: 85,
              totalScore: 100,
              isQualified: true,
            },
            {
              id: '2',
              candidateName: '李四',
              positionTitle: '技术专员',
              subjectName: '专业知识',
              score: 92,
              totalScore: 100,
              isQualified: true,
            },
          ]),
        })
      })

      await page.route('**/api/**', (route) => {
        if (!route.request().url().includes('/scores')) {
          route.fulfill({ status: 200, body: JSON.stringify([]) })
        } else {
          route.continue()
        }
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/scores`)

      // 等待数据加载
      await expect(page.getByText('张三')).toBeVisible()
      await expect(page.getByText('李四')).toBeVisible()

      // 搜索
      await page.getByPlaceholder(/搜索/).fill('张三')

      // 验证搜索结果
      await expect(page.getByText('张三')).toBeVisible()
      // 李四应该被过滤掉（注意：这里需要等待一下让过滤生效）
      await page.waitForTimeout(300)
    })

    test('应该能够导出成绩', async ({ page }) => {
      // Mock scores
      await page.route(`**/api/exams/${examId}/scores`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              candidateName: '张三',
              positionTitle: '行政专员',
              subjectName: '行政能力测试',
              score: 85,
              totalScore: 100,
              isQualified: true,
            },
          ]),
        })
      })

      await page.route('**/api/**', (route) => {
        if (!route.request().url().includes('/scores')) {
          route.fulfill({ status: 200, body: JSON.stringify({ title: '测试考试' }) })
        } else {
          route.continue()
        }
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/scores`)

      // 等待数据加载
      await expect(page.getByText('张三')).toBeVisible()

      // 监听下载事件
      const downloadPromise = page.waitForEvent('download')

      // 点击导出按钮
      await page.getByRole('button', { name: /导出成绩/ }).click()

      // 验证下载开始
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
    })
  })

  test.describe('成绩查询页面（考生端）', () => {
    test('应该正确显示成绩查询页面', async ({ page }) => {
      // Mock applications
      await page.route('**/api/applications/my', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              applicationNo: 'APP001',
              examTitle: '2024年春季招聘考试',
              positionTitle: '行政专员',
              reviewStatus: 'APPROVED',
              paymentStatus: 'PAID',
            },
          ]),
        })
      })

      // Mock scores
      await page.route('**/api/scores/my', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              applicationId: '1',
              subjectName: '行政能力测试',
              score: 85,
              totalScore: 100,
              isQualified: true,
              rank: 5,
            },
          ]),
        })
      })

      // Mock statistics
      await page.route('**/api/scores/my/statistics', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            totalScore: 85,
            averageScore: 85,
            maxScore: 85,
            minScore: 85,
            passRate: 1.0,
            rank: 5,
            totalCandidates: 20,
          }),
        })
      })

      await page.goto(`/${tenantSlug}/candidate/scores`)

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '我的成绩' })).toBeVisible()

      // 验证统计卡片
      await expect(page.getByText('总分')).toBeVisible()
      await expect(page.getByText('平均分')).toBeVisible()
      await expect(page.getByText('及格率')).toBeVisible()
      await expect(page.getByText('排名')).toBeVisible()

      // 验证成绩显示
      await expect(page.getByText('2024年春季招聘考试')).toBeVisible()
      await expect(page.getByText('行政能力测试')).toBeVisible()
      await expect(page.getByText('85')).toBeVisible()
    })

    test('应该显示暂无成绩提示', async ({ page }) => {
      // Mock applications with no scores
      await page.route('**/api/applications/my', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              applicationNo: 'APP001',
              examTitle: '2024年春季招聘考试',
              positionTitle: '行政专员',
            },
          ]),
        })
      })

      await page.route('**/api/scores/my', (route) => {
        route.fulfill({ status: 200, body: JSON.stringify([]) })
      })

      await page.route('**/api/scores/my/statistics', (route) => {
        route.fulfill({ status: 200, body: JSON.stringify(null) })
      })

      await page.goto(`/${tenantSlug}/candidate/scores`)

      // 验证暂无成绩提示
      await expect(page.getByText('暂无成绩')).toBeVisible()
      await expect(page.getByText('该考试成绩尚未公布，请耐心等待。')).toBeVisible()
    })
  })

  test.describe('成绩统计页面', () => {
    test('应该正确显示成绩统计页面', async ({ page }) => {
      // Mock exam
      await page.route(`**/api/exams/${examId}`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: examId,
            title: '2024年春季招聘考试',
          }),
        })
      })

      // Mock statistics
      await page.route(`**/api/exams/${examId}/scores/statistics`, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            totalCandidates: 100,
            totalScores: 8500,
            averageScore: 85,
            maxScore: 98,
            minScore: 60,
            passRate: 0.9,
            scoreDistribution: [
              { range: '0-60', count: 10 },
              { range: '60-70', count: 20 },
              { range: '70-80', count: 30 },
              { range: '80-90', count: 25 },
              { range: '90-100', count: 15 },
            ],
            subjectStatistics: [
              {
                subjectName: '行政能力测试',
                averageScore: 82,
                passRate: 0.85,
                maxScore: 98,
                minScore: 60,
              },
            ],
            positionStatistics: [
              {
                positionTitle: '行政专员',
                candidateCount: 50,
                averageScore: 85,
                passRate: 0.9,
              },
            ],
          }),
        })
      })

      await page.goto(`/${tenantSlug}/admin/exams/${examId}/scores/statistics`)

      // 验证页面标题
      await expect(page.getByRole('heading', { name: '成绩统计' })).toBeVisible()

      // 验证统计卡片
      await expect(page.getByText('总考生数')).toBeVisible()
      await expect(page.getByText('100')).toBeVisible()
      await expect(page.getByText('平均分')).toBeVisible()
      await expect(page.getByText('85.00')).toBeVisible()
      await expect(page.getByText('及格率')).toBeVisible()
      await expect(page.getByText('90.0%')).toBeVisible()

      // 验证图表标题
      await expect(page.getByText('成绩分布')).toBeVisible()
      await expect(page.getByText('科目统计')).toBeVisible()
      await expect(page.getByText('岗位统计 - 平均分')).toBeVisible()
      await expect(page.getByText('岗位统计 - 及格率')).toBeVisible()
    })
  })
})

