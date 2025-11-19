import { Client } from 'pg';

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'duanruo-exam-system',
  user: 'postgres',
  password: 'zww0625wh'
};

async function checkSchema() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 检查users表结构
    console.log('📋 users表结构:');
    console.log('='.repeat(80));
    const usersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    usersSchema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    console.log('');

    // 检查所有表
    console.log('📊 所有表:');
    console.log('='.repeat(80));
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    tables.rows.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    console.log('');

    // 查询users表数据
    console.log('👥 users表数据:');
    console.log('='.repeat(80));
    const users = await client.query(`
      SELECT * FROM users LIMIT 5
    `);
    
    if (users.rows.length === 0) {
      console.log('❌ users表为空');
    } else {
      console.log(`找到 ${users.rows.length} 条记录:`);
      users.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. 用户信息:`);
        Object.entries(user).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await client.end();
    console.log('\n✅ 数据库连接已关闭');
  }
}

checkSchema().catch(console.error);

