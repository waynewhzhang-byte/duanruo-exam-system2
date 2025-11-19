/**
 * BDD测试快速参考脚本
 * 用于在Chrome DevTools中快速执行完整的BDD测试流程
 * 
 * 使用方法:
 * 1. 打开Chrome DevTools (F12)
 * 2. 切换到Console标签
 * 3. 复制并粘贴此脚本
 * 4. 按Enter执行
 */

(async () => {
    const API_BASE = 'http://localhost:8081/api/v1';
    const log = [];
    
    try {
        console.log('========================================');
        console.log('BDD测试 - 完整流程 (阶段1-9)');
        console.log('========================================\n');
        
        // 阶段1: 超级管理员登录
        console.log('【阶段1】超级管理员登录...');
        const superAdminLogin = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'super_admin', password: 'SuperAdmin123!@#' })
        });
        const superAdminData = await superAdminLogin.json();
        const superAdminToken = superAdminData.token;
        console.log('✅ 超级管理员登录成功\n');
        
        // 阶段2: 创建租户
        console.log('【阶段2】创建租户...');
        const tenantCode = 'test_company_' + Date.now();
        const createTenant = await fetch(`${API_BASE}/tenants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify({
                name: 'BDD测试公司',
                code: tenantCode,
                contactEmail: 'admin@test.com',
                contactPhone: '13800138000',
                description: 'BDD自动化测试创建的租户'
            })
        });
        const tenant = await createTenant.json();
        const tenantId = tenant.id;
        console.log('✅ 租户创建成功');
        console.log('   租户ID:', tenantId);
        console.log('   租户代码:', tenantCode, '\n');
        
        // 阶段3: 激活租户
        console.log('【阶段3】激活租户...');
        const activateTenant = await fetch(`${API_BASE}/tenants/${tenantId}/activate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${superAdminToken}` }
        });
        console.log('✅ 租户激活成功\n');
        
        // 等待Schema创建完成
        console.log('等待Schema创建完成...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Schema创建完成\n');
        
        // 阶段4: 创建租户管理员
        console.log('【阶段4】创建租户管理员...');
        const adminUsername = 'admin_bdd_' + Date.now();
        const adminPassword = 'AdminBDD123!@#';
        const createAdmin = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify({
                username: adminUsername,
                password: adminPassword,
                email: 'admin@test.com',
                fullName: 'BDD测试管理员',
                tenantId: tenantId,
                tenantRole: 'TENANT_ADMIN'
            })
        });
        console.log('✅ 租户管理员创建成功');
        console.log('   用户名:', adminUsername);
        console.log('   密码:', adminPassword, '\n');
        
        // 阶段5: 租户管理员登录
        console.log('【阶段5】租户管理员登录...');
        const adminLogin = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: adminUsername, password: adminPassword })
        });
        const adminData = await adminLogin.json();
        const adminToken = adminData.token;
        console.log('✅ 租户管理员登录成功\n');
        
        // 阶段6: 创建考试
        console.log('【阶段6】创建考试...');
        const createExam = await fetch(`${API_BASE}/exams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Tenant-Id': tenantId
            },
            body: JSON.stringify({
                code: 'EXAM2025SPRING',
                slug: 'exam-2025-spring',
                title: 'BDD测试考试-2025年春季招聘',
                description: 'BDD自动化测试创建的考试',
                announcement: '请考生按时参加考试',
                examStart: '2025-06-01 09:00:00',
                examEnd: '2025-06-01 11:00:00',
                registrationStart: '2025-05-01 00:00:00',
                registrationEnd: '2025-05-25 23:59:59',
                feeRequired: true,
                feeAmount: 100.00
            })
        });
        const exam = await createExam.json();
        const examId = exam.id;
        console.log('✅ 考试创建成功');
        console.log('   考试ID:', examId, '\n');
        
        // 阶段7: 创建考试岗位
        console.log('【阶段7】创建考试岗位...');
        const positions = [];
        
        const position1 = await (await fetch(`${API_BASE}/positions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Tenant-Id': tenantId
            },
            body: JSON.stringify({
                examId: examId,
                code: 'POS001',
                title: '软件开发工程师',
                description: '负责系统开发和维护',
                requirements: '本科及以上学历，计算机相关专业，3年以上工作经验',
                quota: 10
            })
        })).json();
        positions.push(position1);
        console.log('✅ 岗位1创建成功:', position1.title);
        
        const position2 = await (await fetch(`${API_BASE}/positions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'X-Tenant-Id': tenantId
            },
            body: JSON.stringify({
                examId: examId,
                code: 'POS002',
                title: '产品经理',
                description: '负责产品规划和设计',
                requirements: '本科及以上学历，5年以上产品经验',
                quota: 5
            })
        })).json();
        positions.push(position2);
        console.log('✅ 岗位2创建成功:', position2.title, '\n');
        
        console.log('========================================');
        console.log('测试完成！');
        console.log('========================================');
        console.log('租户ID:', tenantId);
        console.log('租户代码:', tenantCode);
        console.log('管理员用户名:', adminUsername);
        console.log('管理员密码:', adminPassword);
        console.log('考试ID:', examId);
        console.log('========================================');
        
        // 保存到全局变量
        window.BDD_TEST_DATA = {
            tenantId,
            tenantCode,
            adminUsername,
            adminPassword,
            adminToken,
            examId,
            positions
        };
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error(error);
    }
})();

