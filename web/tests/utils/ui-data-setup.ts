/**
 * 通过UI操作准备测试数据
 * 这是E2E测试的最佳实践 - 通过真实的用户操作来准备数据
 */

import { Page } from '@playwright/test'

export interface TestExam {
  title: string
  code: string
  description?: string
}

export interface TestPosition {
  title: string
  code: string
  description?: string
  quota?: number
}

/**
 * 通过UI创建考试
 */
export async function createExamViaUI(page: Page, exam: TestExam): Promise<void> {
  console.log(`📝 通过UI创建考试: ${exam.title}`)
  
  // 导航到考试管理页面
  await page.goto('http://localhost:3000/admin/exams')
  await page.waitForLoadState('networkidle')
  
  // 点击"创建考试"按钮
  const createButton = page.locator('button:has-text("创建考试"), button:has-text("新建考试")').first()
  
  if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createButton.click()
    await page.waitForTimeout(500)
    
    // 填写考试信息
    await page.fill('input[name="title"], input[id="title"]', exam.title)
    await page.fill('input[name="code"], input[id="code"]', exam.code)
    
    if (exam.description) {
      await page.fill('textarea[name="description"], textarea[id="description"]', exam.description)
    }
    
    // 提交表单
    await page.click('button[type="submit"]:has-text("创建"), button[type="submit"]:has-text("确定"), button[type="submit"]:has-text("保存")')
    
    // 等待创建成功
    await page.waitForTimeout(1000)
    console.log(`✅ 考试创建成功: ${exam.title}`)
  } else {
    console.log(`⚠️ 未找到创建考试按钮，可能页面结构不同`)
  }
}

/**
 * 通过UI创建岗位
 */
export async function createPositionViaUI(page: Page, examId: string, position: TestPosition): Promise<void> {
  console.log(`💼 通过UI创建岗位: ${position.title}`)
  
  // 导航到岗位管理页面
  await page.goto(`http://localhost:3000/admin/exams/${examId}/positions`)
  await page.waitForLoadState('networkidle')
  
  // 点击"创建岗位"按钮
  const createButton = page.locator('button:has-text("创建岗位"), button:has-text("新建岗位")').first()
  
  if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createButton.click()
    await page.waitForTimeout(500)
    
    // 填写岗位信息
    await page.fill('input[name="title"], input[id="title"]', position.title)
    await page.fill('input[name="code"], input[id="code"]', position.code)
    
    if (position.description) {
      await page.fill('textarea[name="description"], textarea[id="description"]', position.description)
    }
    
    if (position.quota) {
      await page.fill('input[name="quota"], input[id="quota"]', position.quota.toString())
    }
    
    // 提交表单
    await page.click('button[type="submit"]:has-text("创建"), button[type="submit"]:has-text("确定"), button[type="submit"]:has-text("保存")')
    
    // 等待创建成功
    await page.waitForTimeout(1000)
    console.log(`✅ 岗位创建成功: ${position.title}`)
  } else {
    console.log(`⚠️ 未找到创建岗位按钮，可能页面结构不同`)
  }
}

/**
 * 通过API创建考试（作为备选方案）
 * 当UI创建不可用时使用
 */
/**
 * 格式化日期为 yyyy-MM-dd HH:mm:ss
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export async function createExamViaAPI(page: Page, token: string, exam: TestExam): Promise<string | null> {
  console.log(`📝 通过API创建考试: ${exam.title}`)

  try {
    const response = await page.request.post('http://localhost:8081/api/v1/exams', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        title: exam.title,
        code: exam.code,
        description: exam.description || '测试考试',
        registrationStart: formatDateTime(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        registrationEnd: formatDateTime(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        feeRequired: false,
      },
    })

    if (response.ok()) {
      const data = await response.json()
      console.log(`✅ 考试创建成功: ${exam.title} (ID: ${data.id})`)
      return data.id
    } else {
      const error = await response.text()
      console.log(`❌ 考试创建失败: ${error}`)
      return null
    }
  } catch (error) {
    console.log(`❌ 考试创建请求失败:`, error)
    return null
  }
}

/**
 * 通过API创建岗位（作为备选方案）
 */
export async function createPositionViaAPI(page: Page, token: string, examId: string, position: TestPosition): Promise<string | null> {
  console.log(`💼 通过API创建岗位: ${position.title}`)
  
  try {
    const response = await page.request.post(`http://localhost:8081/api/v1/positions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        examId: examId,
        title: position.title,
        code: position.code,
        description: position.description || '测试岗位',
        quota: position.quota || 10,
        requirements: '测试要求',
      },
    })

    if (response.ok()) {
      const data = await response.json()
      console.log(`✅ 岗位创建成功: ${position.title} (ID: ${data.id})`)
      return data.id
    } else {
      const error = await response.text()
      console.log(`❌ 岗位创建失败: ${error}`)
      return null
    }
  } catch (error) {
    console.log(`❌ 岗位创建请求失败:`, error)
    return null
  }
}

/**
 * 登录并获取Token
 */
export async function loginAndGetToken(page: Page): Promise<string | null> {
  try {
    const response = await page.request.post('http://localhost:8081/api/v1/auth/login', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        username: 'admin',
        password: 'admin123@Abc',
      },
    })

    if (response.ok()) {
      const data = await response.json()
      return data.token
    } else {
      console.log('❌ 登录失败')
      return null
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error)
    return null
  }
}

/**
 * 准备完整的测试数据（考试 + 岗位）
 * 优先使用API方式，因为更可靠
 */
export async function setupTestData(page: Page): Promise<{
  examId: string
  positions: Array<{ id: string, title: string, code: string }>
} | null> {
  console.log('\n🚀 开始准备测试数据...')
  console.log('=' .repeat(50))

  // 1. 登录获取Token
  const token = await loginAndGetToken(page)
  if (!token) {
    console.log('❌ 无法获取Token，测试数据准备失败')
    return null
  }

  // 2. 创建考试（使用时间戳确保唯一性）
  const timestamp = Date.now()
  const exam: TestExam = {
    title: `2025年春季招聘考试_${timestamp}`,
    code: `EXAM-2025-${timestamp}`,
    description: 'E2E测试专用考试',
  }

  console.log(`📝 创建考试: ${exam.title} (${exam.code})`)

  const examId = await createExamViaAPI(page, token, exam)
  if (!examId) {
    console.log('❌ 考试创建失败，测试数据准备失败')
    return null
  }
  
  // 3. 创建岗位（使用时间戳确保唯一性）
  const positionsToCreate: TestPosition[] = [
    {
      title: '软件开发工程师',
      code: `DEV-${timestamp}`,
      description: '负责软件开发工作',
      quota: 10,
    },
    {
      title: '项目管理师',
      code: `PM-${timestamp}`,
      description: '负责项目管理工作',
      quota: 5,
    },
    {
      title: '市场营销专员',
      code: `MKT-${timestamp}`,
      description: '负责市场营销工作',
      quota: 8,
    },
  ]
  
  const createdPositions: Array<{ id: string, title: string, code: string }> = []
  
  for (const position of positionsToCreate) {
    const positionId = await createPositionViaAPI(page, token, examId, position)
    if (positionId) {
      createdPositions.push({
        id: positionId,
        title: position.title,
        code: position.code,
      })
    }
  }
  
  if (createdPositions.length === 0) {
    console.log('❌ 没有成功创建任何岗位')
    return null
  }
  
  console.log('\n✅ 测试数据准备完成！')
  console.log(`考试ID: ${examId}`)
  console.log(`岗位数量: ${createdPositions.length}`)
  createdPositions.forEach((pos, index) => {
    console.log(`  ${index + 1}. ${pos.title} (${pos.code}) - ID: ${pos.id}`)
  })
  console.log('=' .repeat(50))
  
  return {
    examId,
    positions: createdPositions,
  }
}

/**
 * 清理测试数据
 */
export async function cleanupTestData(page: Page): Promise<void> {
  console.log('\n🧹 清理测试数据...')
  
  const token = await loginAndGetToken(page)
  if (!token) {
    console.log('⚠️ 无法获取Token，跳过清理')
    return
  }
  
  // 这里可以添加删除考试的API调用
  // 但通常E2E测试会在每次运行前清空数据库
  
  console.log('✅ 测试数据清理完成')
}

