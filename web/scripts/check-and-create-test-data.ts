/**
 * 检查并创建测试数据
 */

import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'duanruo-exam-system',
  user: 'postgres',
  password: 'zww0625wh',
})

async function checkExams() {
  console.log('\n📋 检查考试数据')
  console.log('=' .repeat(50))
  
  const result = await pool.query('SELECT id, title, code, status FROM exam ORDER BY created_at DESC LIMIT 10')
  
  console.log(`找到 ${result.rows.length} 个考试:`)
  result.rows.forEach((exam, index) => {
    console.log(`${index + 1}. ${exam.title} (${exam.code}) - 状态: ${exam.status}`)
  })
  
  return result.rows
}

async function checkPositions() {
  console.log('\n💼 检查岗位数据')
  console.log('=' .repeat(50))
  
  const result = await pool.query('SELECT id, title, code, exam_id FROM position ORDER BY created_at DESC LIMIT 10')
  
  console.log(`找到 ${result.rows.length} 个岗位:`)
  result.rows.forEach((position, index) => {
    console.log(`${index + 1}. ${position.title} (${position.code}) - 考试ID: ${position.exam_id}`)
  })
  
  return result.rows
}

async function checkSubjects() {
  console.log('\n📝 检查科目数据')
  console.log('=' .repeat(50))
  
  const result = await pool.query('SELECT id, name, type, position_id FROM subject ORDER BY created_at DESC LIMIT 10')
  
  console.log(`找到 ${result.rows.length} 个科目:`)
  result.rows.forEach((subject, index) => {
    console.log(`${index + 1}. ${subject.name} (${subject.type}) - 岗位ID: ${subject.position_id}`)
  })
  
  return result.rows
}

async function checkTenants() {
  console.log('\n🏢 检查租户数据')
  console.log('=' .repeat(50))
  
  const result = await pool.query('SELECT id, name, code, status FROM tenant ORDER BY created_at DESC LIMIT 10')
  
  console.log(`找到 ${result.rows.length} 个租户:`)
  result.rows.forEach((tenant, index) => {
    console.log(`${index + 1}. ${tenant.name} (${tenant.code}) - 状态: ${tenant.status}`)
  })
  
  return result.rows
}

async function main() {
  console.log('🚀 开始检查数据库测试数据')
  console.log('=' .repeat(50))

  try {
    await pool.connect()
    console.log('✅ 数据库连接成功')

    const tenants = await checkTenants()
    const exams = await checkExams()
    const positions = await checkPositions()
    const subjects = await checkSubjects()

    console.log('\n' + '=' .repeat(50))
    console.log('📊 数据统计:')
    console.log(`租户: ${tenants.length}`)
    console.log(`考试: ${exams.length}`)
    console.log(`岗位: ${positions.length}`)
    console.log(`科目: ${subjects.length}`)
    console.log('=' .repeat(50))

    if (exams.length === 0) {
      console.log('\n⚠️ 警告: 数据库中没有考试数据！')
      console.log('这就是为什么E2E测试无法创建科目的原因。')
      console.log('\n建议: 运行数据库迁移脚本或手动创建测试数据')
    }

  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)

