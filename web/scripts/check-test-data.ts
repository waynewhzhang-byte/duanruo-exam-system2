import { Client } from 'pg';

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'duanruo-exam-system',
  user: 'postgres',
  password: 'zww0625wh'
};

async function checkTestData() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 1. 检查用户表
    console.log('📊 检查用户数据:');
    console.log('='.repeat(80));
    const usersResult = await client.query(`
      SELECT id, username, email, full_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (usersResult.rows.length === 0) {
      console.log('❌ 用户表为空！');
    } else {
      console.log(`找到 ${usersResult.rows.length} 个用户:`);
      usersResult.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email}) - ${user.role} - ${user.full_name}`);
      });
    }
    console.log('');

    // 2. 检查admin用户
    console.log('🔍 检查admin用户:');
    console.log('='.repeat(80));
    const adminResult = await client.query(`
      SELECT id, username, email, full_name, role, created_at 
      FROM users 
      WHERE username = 'admin' OR email = 'admin@duanruo.com'
    `);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ 未找到admin用户！');
    } else {
      console.log('✅ 找到admin用户:');
      adminResult.rows.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   用户名: ${user.username}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   姓名: ${user.full_name}`);
        console.log(`   角色: ${user.role}`);
        console.log(`   创建时间: ${user.created_at}`);
      });
    }
    console.log('');

    // 3. 检查租户表
    console.log('🏢 检查租户数据:');
    console.log('='.repeat(80));
    const tenantsResult = await client.query(`
      SELECT id, name, code, created_at 
      FROM tenants 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (tenantsResult.rows.length === 0) {
      console.log('❌ 租户表为空！');
    } else {
      console.log(`找到 ${tenantsResult.rows.length} 个租户:`);
      tenantsResult.rows.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.name} (${tenant.code})`);
      });
    }
    console.log('');

    // 4. 检查考试表
    console.log('📝 检查考试数据:');
    console.log('='.repeat(80));
    const examsResult = await client.query(`
      SELECT id, code, title, status, created_at 
      FROM exams 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (examsResult.rows.length === 0) {
      console.log('❌ 考试表为空！');
    } else {
      console.log(`找到 ${examsResult.rows.length} 个考试:`);
      examsResult.rows.forEach((exam, index) => {
        console.log(`${index + 1}. ${exam.title} (${exam.code}) - ${exam.status}`);
      });
    }
    console.log('');

    // 5. 检查岗位表
    console.log('💼 检查岗位数据:');
    console.log('='.repeat(80));
    const positionsResult = await client.query(`
      SELECT id, code, title, exam_id, created_at 
      FROM positions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (positionsResult.rows.length === 0) {
      console.log('❌ 岗位表为空！');
    } else {
      console.log(`找到 ${positionsResult.rows.length} 个岗位:`);
      positionsResult.rows.forEach((position, index) => {
        console.log(`${index + 1}. ${position.title} (${position.code}) - 考试ID: ${position.exam_id}`);
      });
    }
    console.log('');

    // 6. 检查科目表
    console.log('📚 检查科目数据:');
    console.log('='.repeat(80));
    const subjectsResult = await client.query(`
      SELECT id, name, type, position_id, created_at 
      FROM subjects 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (subjectsResult.rows.length === 0) {
      console.log('❌ 科目表为空！');
    } else {
      console.log(`找到 ${subjectsResult.rows.length} 个科目:`);
      subjectsResult.rows.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} (${subject.type}) - 岗位ID: ${subject.position_id}`);
      });
    }
    console.log('');

    // 7. 生成总结报告
    console.log('📋 数据总结:');
    console.log('='.repeat(80));
    console.log(`用户总数: ${usersResult.rows.length}`);
    console.log(`Admin用户: ${adminResult.rows.length > 0 ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`租户总数: ${tenantsResult.rows.length}`);
    console.log(`考试总数: ${examsResult.rows.length}`);
    console.log(`岗位总数: ${positionsResult.rows.length}`);
    console.log(`科目总数: ${subjectsResult.rows.length}`);
    console.log('');

    // 8. 检查是否需要初始化测试数据
    const needsTestData = 
      adminResult.rows.length === 0 || 
      tenantsResult.rows.length === 0 || 
      examsResult.rows.length === 0;

    if (needsTestData) {
      console.log('⚠️  建议: 需要初始化测试数据');
      console.log('   运行: npm run init-test-data');
    } else {
      console.log('✅ 测试数据完整');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ 数据库连接已关闭');
  }
}

// 运行检查
checkTestData().catch(console.error);

