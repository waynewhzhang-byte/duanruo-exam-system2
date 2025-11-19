/**
 * Chrome DevTools 完整UI测试
 * 测试内容：
 * 1. 登录后权限是否正常
 * 2. 各个操作UI功能是否可以正常调用
 */

// 测试配置
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8081/api/v1';

// 测试账户
const TEST_ACCOUNTS = {
  superAdmin: {
    username: 'super_admin',
    password: 'SuperAdmin123!@#',
    role: 'SUPER_ADMIN',
    expectedPermissions: [
      'TENANT_CREATE',
      'TENANT_UPDATE',
      'TENANT_DELETE',
      'TENANT_VIEW',
      'USER_MANAGE'
    ]
  },
  tenantAdmin: {
    username: 'tenant_admin_1762476737466',
    password: 'TenantAdmin@123',
    role: 'TENANT_ADMIN',
    expectedPermissions: [
      'EXAM_CREATE',
      'EXAM_UPDATE',
      'EXAM_DELETE',
      'EXAM_VIEW',
      'POSITION_CREATE',
      'SUBJECT_CREATE',
      'SCORE_MANAGE'
    ]
  },
  candidate: {
    username: 'candidate_1762476516042',
    password: 'Candidate@123',
    role: 'CANDIDATE',
    expectedPermissions: [
      'APPLICATION_CREATE',
      'APPLICATION_VIEW',
      'TICKET_VIEW',
      'SCORE_VIEW'
    ]
  },
  reviewer1: {
    username: 'bdd_reviewer1',
    password: 'Reviewer123!@#',
    role: 'PRIMARY_REVIEWER',
    expectedPermissions: [
      'APPLICATION_REVIEW_PRIMARY'
    ]
  },
  reviewer2: {
    username: 'bdd_reviewer2',
    password: 'Reviewer123!@#',
    role: 'SECONDARY_REVIEWER',
    expectedPermissions: [
      'APPLICATION_REVIEW_SECONDARY'
    ]
  }
};

/**
 * Chrome DevTools 测试指南
 */
console.log(`
========================================
Chrome DevTools UI 完整测试指南
========================================

测试目标：
1. ✅ 登录后权限是否正常
2. ✅ 各个操作UI功能是否可以正常调用

前置条件：
- 后端服务运行在: ${API_URL}
- 前端服务运行在: ${BASE_URL}
- 浏览器已打开登录页面

========================================
测试场景1: 超级管理员权限测试
========================================

步骤1: 登录
-----------
在Chrome DevTools Console中执行:

document.querySelector('input[name="username"]').value = '${TEST_ACCOUNTS.superAdmin.username}';
document.querySelector('input[name="password"]').value = '${TEST_ACCOUNTS.superAdmin.password}';
document.querySelector('button[type="submit"]').click();

步骤2: 验证登录成功
-----------------
1. Network标签: 查看 /api/v1/auth/login 返回200
2. Application标签: 查看Local Storage中的token和user
3. 验证user.roles包含: ${TEST_ACCOUNTS.superAdmin.role}

步骤3: 测试租户管理权限
--------------------
在Console中执行:

// 获取当前用户信息
const user = JSON.parse(localStorage.getItem('user'));
console.log('当前用户:', user);
console.log('用户角色:', user.roles);

// 测试访问租户列表
fetch('${API_URL}/tenants', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('✅ 租户列表:', data))
.catch(err => console.error('❌ 访问失败:', err));

步骤4: 测试创建租户功能
--------------------
// 测试创建租户
fetch('${API_URL}/tenants', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '测试租户_' + Date.now(),
    code: 'test_' + Date.now(),
    contactEmail: 'test@example.com',
    contactPhone: '13800138000'
  })
})
.then(r => r.json())
.then(data => console.log('✅ 创建租户成功:', data))
.catch(err => console.error('❌ 创建失败:', err));

========================================
测试场景2: 租户管理员权限测试
========================================

步骤1: 退出登录并重新登录
-----------------------
// 清除当前登录状态
localStorage.clear();
location.href = '${BASE_URL}/login';

// 等待页面加载后，执行登录
document.querySelector('input[name="username"]').value = '${TEST_ACCOUNTS.tenantAdmin.username}';
document.querySelector('input[name="password"]').value = '${TEST_ACCOUNTS.tenantAdmin.password}';
document.querySelector('button[type="submit"]').click();

步骤2: 验证租户管理员权限
----------------------
// 获取租户ID
const tenantId = JSON.parse(localStorage.getItem('user')).tenantId || '421eee4a-1a2a-4f9d-95a4-37073d4b15c5';

// 测试查看考试列表
fetch(\`${API_URL}/\${tenantId}/exams\`, {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'X-Tenant-Id': tenantId
  }
})
.then(r => r.json())
.then(data => console.log('✅ 考试列表:', data))
.catch(err => console.error('❌ 访问失败:', err));

步骤3: 测试创建考试功能
--------------------
fetch(\`${API_URL}/\${tenantId}/exams\`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'X-Tenant-Id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    examName: 'UI测试考试_' + Date.now(),
    examType: 'RECRUITMENT',
    registrationStart: '2025-01-01 00:00:00',
    registrationEnd: '2025-12-31 23:59:59',
    examStart: '2026-01-01 09:00:00',
    examEnd: '2026-01-01 12:00:00',
    feeRequired: false
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ 创建考试成功:', data);
  // 保存考试ID供后续测试使用
  sessionStorage.setItem('testExamId', data.data.id);
})
.catch(err => console.error('❌ 创建失败:', err));

步骤4: 测试权限边界（应该失败）
---------------------------
// 租户管理员不应该能访问其他租户的数据
fetch('${API_URL}/00000000-0000-0000-0000-000000000001/exams', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'X-Tenant-Id': '00000000-0000-0000-0000-000000000001'
  }
})
.then(r => r.json())
.then(data => console.error('❌ 权限检查失败: 不应该能访问其他租户数据'))
.catch(err => console.log('✅ 权限检查正常: 无法访问其他租户数据'));

========================================
测试场景3: 考生权限测试
========================================

// 重新登录为考生
localStorage.clear();
location.href = '${BASE_URL}/login';

document.querySelector('input[name="username"]').value = '${TEST_ACCOUNTS.candidate.username}';
document.querySelector('input[name="password"]').value = '${TEST_ACCOUNTS.candidate.password}';
document.querySelector('button[type="submit"]').click();

// 测试查看报名列表
fetch('${API_URL}/applications/my', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('✅ 我的报名:', data))
.catch(err => console.error('❌ 访问失败:', err));

// 测试权限边界（考生不应该能创建考试）
const tenantId = '421eee4a-1a2a-4f9d-95a4-37073d4b15c5';
fetch(\`${API_URL}/\${tenantId}/exams\`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'X-Tenant-Id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ examName: 'test' })
})
.then(r => r.json())
.then(data => console.error('❌ 权限检查失败: 考生不应该能创建考试'))
.catch(err => console.log('✅ 权限检查正常: 考生无法创建考试'));

========================================
测试总结
========================================

验证清单：
□ 超级管理员可以管理租户
□ 租户管理员可以管理考试
□ 租户管理员不能访问其他租户数据
□ 考生可以查看自己的报名
□ 考生不能创建考试
□ 审核员可以审核报名
□ 所有API调用都包含正确的Authorization头
□ 权限边界检查正常工作

`);

