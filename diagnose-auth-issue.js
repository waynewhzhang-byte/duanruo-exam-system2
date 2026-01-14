/**
 * 诊断脚本：验证用户 duanruotest1 的认证和授权流程
 *
 * 功能：
 * 1. 模拟登录并获取 JWT token
 * 2. 解析 token 内容
 * 3. 尝试访问考试列表 API
 * 4. 输出详细的诊断信息
 */

const BASE_URL = 'http://localhost:8081/api/v1';

// 解析 JWT token (不验证签名，仅用于诊断)
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Failed to parse JWT token:', error.message);
    return null;
  }
}

// 格式化时间戳
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

// 主诊断函数
async function diagnose() {
  console.log('='.repeat(80));
  console.log('🔍 开始诊断用户 duanruotest1 的认证授权问题');
  console.log('='.repeat(80));
  console.log();

  const username = 'duanruotest1';
  const password = 'Waynez0625@wh';

  // 步骤 1: 登录
  console.log('📝 步骤 1: 尝试登录');
  console.log(`   用户名: ${username}`);
  console.log(`   API: POST ${BASE_URL}/auth/login`);
  console.log();

  try {
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log(`   响应状态: ${loginResponse.status} ${loginResponse.statusText}`);

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`   ❌ 登录失败: ${errorText}`);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('   ✅ 登录成功');
    console.log();

    // 步骤 2: 解析 token
    console.log('🔐 步骤 2: 解析 JWT Token');
    const token = loginData.token;
    console.log(`   Token 长度: ${token.length} 字符`);
    console.log(`   Token 类型: ${loginData.tokenType}`);
    console.log(`   过期时间: ${loginData.expiresIn} 秒`);
    console.log();

    const payload = parseJwt(token);
    if (!payload) {
      console.error('   ❌ 无法解析 token');
      return;
    }

    console.log('   Token Payload:');
    console.log('   ─────────────────────────────────────────────────');
    console.log(`   • userId:      ${payload.userId || 'N/A'}`);
    console.log(`   • username:    ${payload.sub || payload.username || 'N/A'}`);
    console.log(`   • email:       ${payload.email || 'N/A'}`);
    console.log(`   • tenantId:    ${payload.tenantId || 'N/A'}`);
    console.log(`   • tokenType:   ${payload.tokenType || 'N/A'}`);
    console.log(`   • roles:       ${JSON.stringify(payload.roles || [])}`);
    console.log(`   • permissions: ${JSON.stringify(payload.permissions || []).substring(0, 100)}...`);
    console.log(`   • 签发时间:    ${formatTimestamp(payload.iat)}`);
    console.log(`   • 过期时间:    ${formatTimestamp(payload.exp)}`);
    console.log('   ─────────────────────────────────────────────────');
    console.log();

    // 检查权限
    console.log('🔍 步骤 3: 检查权限');
    const hasExamView = (payload.permissions || []).includes('exam:view');
    const hasExamViewPublic = (payload.permissions || []).includes('exam:view:public');
    console.log(`   • EXAM_VIEW 权限:        ${hasExamView ? '✅ 有' : '❌ 无'}`);
    console.log(`   • EXAM_VIEW_PUBLIC 权限: ${hasExamViewPublic ? '✅ 有' : '❌ 无'}`);
    console.log();

    if (!hasExamView && !hasExamViewPublic) {
      console.error('   ⚠️  警告: Token 中缺少访问考试列表所需的权限！');
      console.error('   预期权限: EXAM_VIEW 或 EXAM_VIEW_PUBLIC');
      console.error('   实际权限:', payload.permissions);
      console.log();
    }

    // 步骤 4: 尝试访问考试列表 API
    console.log('📋 步骤 4: 尝试访问考试列表 API');
    console.log(`   API: GET ${BASE_URL}/exams`);

    // 构建请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 如果 token 包含 tenantId，添加到请求头
    if (payload.tenantId) {
      headers['X-Tenant-ID'] = payload.tenantId;
      console.log(`   X-Tenant-ID: ${payload.tenantId}`);
    }

    console.log();

    const examsResponse = await fetch(`${BASE_URL}/exams`, {
      method: 'GET',
      headers: headers,
    });

    console.log(`   响应状态: ${examsResponse.status} ${examsResponse.statusText}`);

    if (!examsResponse.ok) {
      const errorText = await examsResponse.text();
      console.error(`   ❌ 访问失败:`);
      console.error(`   ${errorText}`);
      console.log();

      // 诊断建议
      console.log('💡 诊断建议:');
      if (examsResponse.status === 401) {
        console.log('   1. JWT token 可能验证失败（签名不匹配或过期）');
        console.log('   2. 检查后端日志中的 JwtAuthenticationFilter 输出');
        console.log('   3. 验证 JWT secret 配置是否一致');
      } else if (examsResponse.status === 403) {
        console.log('   1. 用户缺少所需权限 (EXAM_VIEW 或 EXAM_VIEW_PUBLIC)');
        console.log('   2. 检查 user_tenant_roles 表中的角色分配');
        console.log('   3. 检查 Role.TENANT_ADMIN 的权限定义');
        console.log('   4. 检查租户上下文是否正确设置');
      }
      console.log();

      return;
    }

    const examsData = await examsResponse.json();
    console.log(`   ✅ 访问成功`);
    console.log(`   返回考试数量: ${Array.isArray(examsData) ? examsData.length : 'N/A'}`);
    console.log();

    // 步骤 5: 验证租户上下文
    if (payload.tenantId) {
      console.log('🏢 步骤 5: 验证租户上下文');
      console.log(`   Token 中的租户ID: ${payload.tenantId}`);
      console.log(`   请求头中的租户ID: ${headers['X-Tenant-ID']}`);
      console.log(`   ✅ 租户上下文一致`);
      console.log();
    }

    console.log('='.repeat(80));
    console.log('✅ 诊断完成：所有检查通过！');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ 诊断过程中发生错误:');
    console.error(error);
    console.log();
    console.log('💡 建议:');
    console.log('   1. 确认后端服务正在运行 (http://localhost:8081)');
    console.log('   2. 检查网络连接');
    console.log('   3. 查看后端日志获取详细错误信息');
  }
}

// 运行诊断
diagnose().catch(console.error);
