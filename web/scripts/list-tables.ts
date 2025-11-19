/**
 * 列出数据库中的所有表
 */

import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'duanruo-exam-system',
  user: 'postgres',
  password: 'zww0625wh',
})

async function listTables() {
  try {
    await pool.connect()
    console.log('✅ 数据库连接成功\n')

    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    console.log(`找到 ${result.rows.length} 个表:\n`)
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`)
    })

  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    await pool.end()
  }
}

listTables()

