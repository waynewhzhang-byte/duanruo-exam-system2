#!/usr/bin/env tsx
/**
 * 确保管理员用户存在
 * 用于E2E测试前的数据准备
 */

import { Client } from 'pg';

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'duanruo-exam-system',
  user: 'postgres',
  password: 'zww0625wh'
};

const ADMIN_USER = {
  username: 'admin',
  email: 'admin@duanruo.com',
  password: 'admin123@Abc',
  fullName: '系统管理员',
  roles: '["ADMIN","SUPER_ADMIN"]'
};

async function ensureAdminUser() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 1. 检查管理员用户是否存在
    console.log('🔍 检查管理员用户是否存在...');
    const checkResult = await client.query(`
      SELECT id, username, email, roles, status, created_at
      FROM users
      WHERE username = $1
    `, [ADMIN_USER.username]);

    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      console.log('✅ 管理员用户已存在:');
      console.log(`   ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   角色: ${user.roles}`);
      console.log(`   状态: ${user.status}`);
      console.log(`   创建时间: ${user.created_at}`);
      
      // 检查密码是否正确（通过尝试更新）
      console.log('\n🔐 更新管理员密码（确保密码正确）...');
      // 确保pgcrypto可用以生成bcrypt哈希
      await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
      await client.query(`
        UPDATE users
        SET password_hash = crypt($1, gen_salt('bf')),
            roles = $2::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE username = $3
      `, [ADMIN_USER.password, ADMIN_USER.roles, ADMIN_USER.username]);
      console.log('✅ 管理员密码已更新');
      
      return true;
    }

    // 2. 管理员用户不存在，创建新用户
    console.log('⚠️  管理员用户不存在，开始创建...\n');
    
    // 确保pgcrypto扩展存在
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    
    // 创建管理员用户
    const insertResult = await client.query(`
      INSERT INTO users (
        id, 
        username, 
        email, 
        password_hash, 
        full_name, 
        roles, 
        status,
        email_verified,
        created_at, 
        updated_at,
        version
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        crypt($3, gen_salt('bf')),
        $4,
        $5::jsonb,
        'ACTIVE',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        0
      )
      RETURNING id, username, email, roles
    `, [
      ADMIN_USER.username,
      ADMIN_USER.email,
      ADMIN_USER.password,
      ADMIN_USER.fullName,
      ADMIN_USER.roles
    ]);

    const newUser = insertResult.rows[0];
    console.log('✅ 管理员用户创建成功:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   用户名: ${newUser.username}`);
    console.log(`   邮箱: ${newUser.email}`);
    console.log(`   角色: ${newUser.roles}`);
    console.log(`   密码: ${ADMIN_USER.password}`);

    // 3. 为管理员用户添加默认租户的TENANT_ADMIN角色
    console.log('\n🏢 为管理员添加默认租户角色...');
    
    // 确保默认租户存在
    await client.query(`
      INSERT INTO tenants (id, name, code, schema_name, status, contact_email, description, activated_at)
      VALUES (
        '00000000-0000-0000-0000-000000000001'::UUID,
        '默认租户',
        'default',
        'public',
        'ACTIVE',
        'admin@duanruo.com',
        '系统默认租户',
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (code) DO NOTHING
    `);

    // 添加租户角色
    await client.query(`
      INSERT INTO user_tenant_roles (user_id, tenant_id, role, granted_at, active)
      SELECT 
        u.id,
        '00000000-0000-0000-0000-000000000001'::UUID,
        'TENANT_ADMIN',
        CURRENT_TIMESTAMP,
        TRUE
      FROM users u
      WHERE u.username = $1
        AND NOT EXISTS (
          SELECT 1 FROM user_tenant_roles utr 
          WHERE utr.user_id = u.id 
            AND utr.tenant_id = '00000000-0000-0000-0000-000000000001'::UUID
        )
      ON CONFLICT (user_id, tenant_id, role) DO NOTHING
    `, [ADMIN_USER.username]);

    console.log('✅ 租户角色添加成功');

    // 4. 验证登录
    console.log('\n🔐 验证管理员登录...');
    const loginTest = await client.query(`
      SELECT id, username, email, roles, password_hash
      FROM users
      WHERE username = $1
    `, [ADMIN_USER.username]);

    if (loginTest.rows.length > 0) {
      console.log('✅ 管理员用户验证成功，可以用于登录测试');
      console.log('\n📋 登录凭据:');
      console.log(`   用户名: ${ADMIN_USER.username}`);
      console.log(`   密码: ${ADMIN_USER.password}`);
      console.log(`   邮箱: ${ADMIN_USER.email}`);
    }

    return true;

  } catch (error) {
    console.error('\n❌ 错误:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行
ensureAdminUser()
  .then(success => {
    if (success) {
      console.log('\n✅ 管理员用户准备完成！');
      process.exit(0);
    } else {
      console.log('\n❌ 管理员用户准备失败！');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ 执行失败:', error);
    process.exit(1);
  });

