/**
 * 验证后端功能是否正常工作
 * 测试：
 * 1. 登录功能
 * 2. 科目创建功能
 * 3. 数据库持久化
 */

import { Pool } from 'pg'

const API_BASE_URL = 'http://localhost:8081/api/v1'

interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    email: string
    roles: string[]
  }
}

interface SubjectCreateRequest {
  name: string
  type: 'WRITTEN' | 'INTERVIEW'
  duration: number
  maxScore: number
  passingScore: number
  weight: number
  ordering: number
  schedule: string
}

async function testLogin(): Promise<string | null> {
  console.log('\n🔐 测试1: 管理员登录')
  console.log('=' .repeat(50))
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123@Abc',
      }),
    })

    console.log(`状态码: ${response.status}`)
    
    if (response.ok) {
      const data: LoginResponse = await response.json()
      console.log('✅ 登录成功')
      console.log(`用户: ${data.user.username}`)
      console.log(`角色: ${data.user.roles.join(', ')}`)
      console.log(`Token: ${data.token.substring(0, 20)}...`)
      return data.token
    } else {
      const error = await response.json()
      console.log('❌ 登录失败')
      console.log('错误:', error)
      return null
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error)
    return null
  }
}

async function testInvalidLogin(): Promise<void> {
  console.log('\n🔐 测试2: 无效凭据登录（应该失败）')
  console.log('=' .repeat(50))
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'invalid',
        password: 'wrongpassword',
      }),
    })

    console.log(`状态码: ${response.status}`)
    
    if (!response.ok) {
      const error = await response.json()
      console.log('✅ 正确拒绝了无效凭据')
      console.log('错误消息:', error.message)
    } else {
      console.log('❌ 错误：应该拒绝无效凭据但却成功了')
    }
  } catch (error) {
    console.log('❌ 请求失败:', error)
  }
}

async function getExamsAndPositions(token: string): Promise<{ examId: string, positionId: string } | null> {
  console.log('\n📋 测试3: 获取考试和岗位列表')
  console.log('=' .repeat(50))
  
  try {
    // 获取考试列表
    const examsResponse = await fetch(`${API_BASE_URL}/exams`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    console.log(`考试列表响应状态: ${examsResponse.status}`)

    if (!examsResponse.ok) {
      const errorText = await examsResponse.text()
      console.log('❌ 获取考试列表失败')
      console.log('错误响应:', errorText)
      return null
    }

    const examsData = await examsResponse.json()
    console.log(`✅ 获取到 ${examsData.content?.length || 0} 个考试`)
    
    if (!examsData.content || examsData.content.length === 0) {
      console.log('❌ 没有可用的考试')
      return null
    }

    const exam = examsData.content[0]
    console.log(`选择考试: ${exam.title} (${exam.code})`)

    // 获取岗位列表
    const positionsResponse = await fetch(`${API_BASE_URL}/exams/${exam.id}/positions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!positionsResponse.ok) {
      console.log('❌ 获取岗位列表失败')
      return null
    }

    const positionsData = await positionsResponse.json()
    console.log(`✅ 获取到 ${positionsData.content?.length || 0} 个岗位`)
    
    if (!positionsData.content || positionsData.content.length === 0) {
      console.log('❌ 没有可用的岗位')
      return null
    }

    const position = positionsData.content[0]
    console.log(`选择岗位: ${position.title} (${position.code})`)

    return {
      examId: exam.id,
      positionId: position.id,
    }
  } catch (error) {
    console.log('❌ 获取考试和岗位失败:', error)
    return null
  }
}

async function testCreateSubject(token: string, positionId: string): Promise<string | null> {
  console.log('\n📝 测试4: 创建科目')
  console.log('=' .repeat(50))
  
  const subjectData: SubjectCreateRequest = {
    name: `测试科目_${Date.now()}`,
    type: 'WRITTEN',
    duration: 120,
    maxScore: 100,
    passingScore: 60,
    weight: 0.5,
    ordering: 1,
    schedule: '2025-10-15 09:00:00',
  }

  console.log('科目数据:', subjectData)

  try {
    const response = await fetch(`${API_BASE_URL}/positions/${positionId}/subjects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subjectData),
    })

    console.log(`状态码: ${response.status}`)
    
    if (response.ok) {
      const createdSubject = await response.json()
      console.log('✅ 科目创建成功')
      console.log(`科目ID: ${createdSubject.id}`)
      console.log(`科目名称: ${createdSubject.name}`)
      return createdSubject.id
    } else {
      const error = await response.json()
      console.log('❌ 科目创建失败')
      console.log('错误:', error)
      return null
    }
  } catch (error) {
    console.log('❌ 创建科目请求失败:', error)
    return null
  }
}

async function verifySubjectInDatabase(subjectId: string): Promise<void> {
  console.log('\n🗄️ 测试5: 验证科目是否保存到数据库')
  console.log('=' .repeat(50))
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'duanruo-exam-system',
    user: 'postgres',
    password: 'zww0625wh',
  })

  try {
    await pool.connect()
    console.log('✅ 数据库连接成功')

    const result = await pool.query(
      'SELECT * FROM subject WHERE id = $1',
      [subjectId]
    )

    if (result.rows.length > 0) {
      console.log('✅ 科目已保存到数据库')
      console.log('数据库记录:', result.rows[0])
    } else {
      console.log('❌ 数据库中未找到科目')
    }
  } catch (error) {
    console.log('❌ 数据库查询失败:', error)
  } finally {
    await pool.end()
  }
}

async function main() {
  console.log('🚀 开始验证后端功能')
  console.log('=' .repeat(50))

  // 测试1: 登录
  const token = await testLogin()
  if (!token) {
    console.log('\n❌ 登录失败，无法继续测试')
    process.exit(1)
  }

  // 测试2: 无效登录
  await testInvalidLogin()

  // 测试3: 获取考试和岗位
  const examAndPosition = await getExamsAndPositions(token)
  if (!examAndPosition) {
    console.log('\n❌ 无法获取考试和岗位，无法继续测试')
    process.exit(1)
  }

  // 测试4: 创建科目
  const subjectId = await testCreateSubject(token, examAndPosition.positionId)
  if (!subjectId) {
    console.log('\n❌ 科目创建失败')
    process.exit(1)
  }

  // 测试5: 验证数据库
  await verifySubjectInDatabase(subjectId)

  console.log('\n' + '=' .repeat(50))
  console.log('🎉 所有后端功能测试完成！')
  console.log('=' .repeat(50))
}

main().catch(console.error)

