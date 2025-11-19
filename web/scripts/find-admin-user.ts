import { Client } from 'pg';

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'duanruo-exam-system',
  user: 'postgres',
  password: 'zww0625wh'
};

async function findAdminUser() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 查找admin用户
    console.log('🔍 查找admin用户:');
    console.log('='.repeat(80));
    
    const adminUsers = await client.query(`
      SELECT id, username, email, full_name, roles, status, created_at
      FROM users
      WHERE username LIKE '%admin%' OR email LIKE '%admin%' OR roles LIKE '%ADMIN%'
      ORDER BY created_at DESC
    `);
    
    if (adminUsers.rows.length === 0) {
      console.log('❌ 未找到admin用户\n');
      
      // 显示所有用户
      console.log('📋 所有用户列表:');
      console.log('='.repeat(80));
      const allUsers = await client.query(`
        SELECT username, email, roles, status
        FROM users
        ORDER BY created_at DESC
        LIMIT 20
      `);
      
      allUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email}) - ${user.roles} - ${user.status}`);
      });
      
    } else {
      console.log(`✅ 找到 ${adminUsers.rows.length} 个admin相关用户:\n`);
      
      adminUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. 用户信息:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   用户名: ${user.username}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   姓名: ${user.full_name}`);
        console.log(`   角色: ${user.roles}`);
        console.log(`   状态: ${user.status}`);
        console.log(`   创建时间: ${user.created_at}`);
        console.log('');
      });
    }

    // 检查租户数据
    console.log('\n🏢 检查租户数据:');
    console.log('='.repeat(80));
    const tenants = await client.query(`
      SELECT id, name, code, created_at
      FROM tenants
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (tenants.rows.length === 0) {
      console.log('❌ 租户表为空');
    } else {
      console.log(`找到 ${tenants.rows.length} 个租户:`);
      tenants.rows.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.name} (${tenant.code}) - ID: ${tenant.id}`);
      });
    }

    // 检查考试数据
    console.log('\n📝 检查考试数据:');
    console.log('='.repeat(80));
    const exams = await client.query(`
      SELECT id, code, title, status, created_at
      FROM exams
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (exams.rows.length === 0) {
      console.log('❌ 考试表为空');
    } else {
      console.log(`找到 ${exams.rows.length} 个考试:`);
      exams.rows.forEach((exam, index) => {
        console.log(`${index + 1}. ${exam.title} (${exam.code}) - ${exam.status}`);
      });
    }

    // 检查岗位数据
    console.log('\n💼 检查岗位数据:');
    console.log('='.repeat(80));
    const positions = await client.query(`
      SELECT id, code, title, exam_id, created_at
      FROM positions
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (positions.rows.length === 0) {
      console.log('❌ 岗位表为空');
    } else {
      console.log(`找到 ${positions.rows.length} 个岗位:`);
      positions.rows.forEach((position, index) => {
        console.log(`${index + 1}. ${position.title} (${position.code}) - 考试ID: ${position.exam_id}`);
      });
    }

    // 检查科目数据
    console.log('\n📚 检查科目数据:');
    console.log('='.repeat(80));
    const subjects = await client.query(`
      SELECT id, name, type, position_id, created_at
      FROM subjects
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (subjects.rows.length === 0) {
      console.log('❌ 科目表为空');
    } else {
      console.log(`找到 ${subjects.rows.length} 个科目:`);
      subjects.rows.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} (${subject.type}) - 岗位ID: ${subject.position_id}`);
      });
    }

    // 总结
    console.log('\n📊 数据总结:');
    console.log('='.repeat(80));
    console.log(`Admin用户: ${adminUsers.rows.length > 0 ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`租户数量: ${tenants.rows.length}`);
    console.log(`考试数量: ${exams.rows.length}`);
    console.log(`岗位数量: ${positions.rows.length}`);
    console.log(`科目数量: ${subjects.rows.length}`);

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await client.end();
    console.log('\n✅ 数据库连接已关闭');
  }
}

findAdminUser().catch(console.error);

