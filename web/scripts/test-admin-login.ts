const API_BASE = 'http://localhost:8081/api/v1';

async function testAdminLogin() {
  console.log('🔐 测试admin用户登录\n');
  console.log('='.repeat(80));

  // 测试不同的用户名和密码组合
  const testCases = [
    { username: 'admin', password: 'admin123@Abc', description: '测试用例1: admin / admin123@Abc' },
    { username: 'admin@duanruo.com', password: 'admin123@Abc', description: '测试用例2: admin@duanruo.com / admin123@Abc' },
    { username: 'admin', password: 'Admin123!', description: '测试用例3: admin / Admin123!' },
    { username: 'admin', password: 'password', description: '测试用例4: admin / password' },
  ];

  for (const testCase of testCases) {
    console.log(`\n${testCase.description}`);
    console.log('-'.repeat(80));

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testCase.username,
          password: testCase.password,
        }),
      });

      console.log(`状态码: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ 登录成功!');
        console.log('响应数据:', JSON.stringify(data, null, 2));
        
        // 如果成功，不需要继续测试其他组合
        console.log('\n🎉 找到正确的登录凭据!');
        console.log(`   用户名: ${testCase.username}`);
        console.log(`   密码: ${testCase.password}`);
        return;
      } else {
        const errorData = await response.json();
        console.log('❌ 登录失败');
        console.log('错误信息:', JSON.stringify(errorData, null, 2));
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }
  }

  console.log('\n⚠️  所有测试用例都失败了');
  console.log('建议: 检查admin用户的密码或重置密码');
}

testAdminLogin().catch(console.error);

