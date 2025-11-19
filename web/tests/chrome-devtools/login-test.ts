/**
 * Chrome DevTools 登录测试
 * 使用真实的浏览器进行UI测试
 */

// 测试账户配置
const TEST_ACCOUNTS = {
  superAdmin: {
    username: 'super_admin',
    password: 'SuperAdmin123!@#',
    url: 'http://localhost:3000/login?role=super-admin',
    name: '超级管理员',
    expectedUrl: /\/super-admin/
  },
  tenantAdmin: {
    username: 'tenant_admin_1762476737466',
    password: 'TenantAdmin@123',
    url: 'http://localhost:3000/login',
    name: '租户管理员',
    expectedUrl: /\/admin|\/tenant/
  },
  candidate: {
    username: 'candidate_1762476516042',
    password: 'Candidate@123',
    url: 'http://localhost:3000/login',
    name: '考生',
    expectedUrl: /\/my-/
  },
  reviewer1: {
    username: 'bdd_reviewer1',
    password: 'Reviewer123!@#',
    url: 'http://localhost:3000/login?role=reviewer',
    name: '一级审核员',
    expectedUrl: /\/review/
  },
  reviewer2: {
    username: 'bdd_reviewer2',
    password: 'Reviewer123!@#',
    url: 'http://localhost:3000/login?role=reviewer',
    name: '二级审核员',
    expectedUrl: /\/review/
  }
};

/**
 * 测试登录功能
 */
async function testLogin(accountType: keyof typeof TEST_ACCOUNTS) {
  const account = TEST_ACCOUNTS[accountType];
  
  console.log('\n========================================');
  console.log(`测试: ${account.name}登录`);
  console.log('========================================\n');
  
  console.log('账户信息:');
  console.log(`  用户名: ${account.username}`);
  console.log(`  密码:   ${account.password}`);
  console.log(`  URL:    ${account.url}`);
  console.log('');
  
  console.log('Chrome DevTools 操作步骤:');
  console.log('1. 打开浏览器访问:', account.url);
  console.log('2. 按 F12 打开 Chrome DevTools');
  console.log('3. 在 Console 中执行以下代码:');
  console.log('');
  console.log('   // 填写登录表单');
  console.log(`   document.querySelector('input[name="username"]').value = '${account.username}';`);
  console.log(`   document.querySelector('input[name="password"]').value = '${account.password}';`);
  console.log(`   document.querySelector('button[type="submit"]').click();`);
  console.log('');
  console.log('4. 验证登录成功:');
  console.log('   - Network 标签: 查看 /api/v1/auth/login 请求返回 200');
  console.log('   - Application 标签: 查看 Local Storage 中的 token');
  console.log(`   - 页面跳转到: ${account.expectedUrl}`);
  console.log('');
}

/**
 * 主测试函数
 */
async function main() {
  console.log('========================================');
  console.log('Chrome DevTools UI 登录测试');
  console.log('========================================');
  console.log('');
  
  // 检查服务状态
  console.log('[检查] 验证服务状态...');
  
  try {
    const frontendResponse = await fetch('http://localhost:3000');
    console.log('✅ 前端服务运行正常 (端口3000)');
  } catch (error) {
    console.error('❌ 前端服务未运行 (端口3000)');
    console.log('   请运行: cd web; npm run dev');
    process.exit(1);
  }
  
  try {
    const backendResponse = await fetch('http://localhost:8081/api/v1/health');
    console.log('✅ 后端服务运行正常 (端口8081)');
  } catch (error) {
    console.error('❌ 后端服务未运行 (端口8081)');
    console.log('   请运行: cd exam-bootstrap; mvn spring-boot:run');
    process.exit(1);
  }
  
  console.log('');
  
  // 执行所有登录测试
  await testLogin('superAdmin');
  await testLogin('tenantAdmin');
  await testLogin('candidate');
  await testLogin('reviewer1');
  await testLogin('reviewer2');
  
  console.log('========================================');
  console.log('✅ 测试指南生成完成！');
  console.log('========================================');
  console.log('');
  console.log('下一步:');
  console.log('1. 在浏览器中打开上述URL');
  console.log('2. 按照操作步骤使用 Chrome DevTools 进行测试');
  console.log('3. 或运行自动化测试: npm run test:ui');
  console.log('');
}

// 运行测试
main().catch(console.error);

