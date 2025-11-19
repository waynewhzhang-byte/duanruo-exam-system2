// BDD测试脚本第二阶段：创建管理员并配置考试
// 前置条件：已执行第一阶段脚本，window.BDD_TEST_TENANT_ID 已设置

const API_BASE = 'http://localhost:8081/api/v1';

// 从第一阶段获取租户信息
const tenantId = window.BDD_TEST_TENANT_ID;
const tenantCode = window.BDD_TEST_TENANT_CODE;

if (!tenantId) {
    console.error('❌ 错误：未找到租户ID，请先执行第一阶段脚本');
    throw new Error('Missing tenant ID');
}

console.log('使用租户ID:', tenantId);
console.log('使用租户代码:', tenantCode, '\n');

// 测试数据
const adminData = {
    username: 'admin_bdd',
    password: 'AdminBDD123!@#',
    email: `admin@${tenantCode}.com`,
    fullName: 'BDD测试管理员',
    phoneNumber: '13900139999',
    tenantId: tenantId,
    role: 'TENANT_ADMIN'
};

const timestamp = Date.now();
const examData = {
    code: `EXAM_${timestamp}`,
    title: '2025年春季招聘考试',
    description: '这是一个完整的招聘考试，包含多个岗位和科目',
    announcement: '请各位考生准时参加考试，携带身份证和准考证',
    registrationStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    registrationEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    examStart: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    examEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    feeRequired: true,
    feeAmount: 100.00
};

const positions = [
    {
        code: 'SE001',
        title: '软件工程师',
        description: '负责系统开发和维护',
        requirements: '计算机相关专业，本科及以上学历，3年以上工作经验',
        quota: 10
    },
    {
        code: 'PM001',
        title: '产品经理',
        description: '负责产品规划和设计',
        requirements: '产品管理相关专业，本科及以上学历，5年以上工作经验',
        quota: 5
    }
];

const subjects = [
    { code: 'XINGCE', title: '行政职业能力测验', totalScore: 100 },
    { code: 'ZHUANYE', title: '专业知识', totalScore: 100 }
];

const formTemplate = {
    sections: [
        {
            id: 'personal-info',
            title: '个人信息',
            order: 1,
            fields: [
                { id: 'fullName', label: '姓名', type: 'text', required: true, order: 1 },
                { id: 'idNumber', label: '身份证号', type: 'text', required: true, order: 2 },
                { id: 'phone', label: '手机号', type: 'text', required: true, order: 3 },
                { id: 'email', label: '邮箱', type: 'email', required: true, order: 4 }
            ]
        },
        {
            id: 'education',
            title: '教育背景',
            order: 2,
            fields: [
                { id: 'education', label: '学历', type: 'select', required: true, order: 1,
                  options: ['高中', '大专', '本科', '硕士', '博士'] },
                { id: 'major', label: '专业', type: 'text', required: true, order: 2 },
                { id: 'school', label: '毕业院校', type: 'text', required: true, order: 3 }
            ]
        }
    ]
};

async function runPhase2() {
    console.log('========================================');
    console.log('BDD测试第二阶段：创建管理员并配置考试');
    console.log('========================================\n');
    
    let superAdminToken, tenantAdminToken, examId;
    
    try {
        // 步骤1: 超级管理员登录
        console.log('【步骤1】超级管理员登录...');
        const superAdminLogin = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'super_admin', password: 'SuperAdmin123!@#' })
        });
        const superAdminData = await superAdminLogin.json();
        superAdminToken = superAdminData.token;
        console.log('✅ 超级管理员登录成功\n');
        
        // 步骤2: 创建租户管理员
        console.log('【步骤2】创建租户管理员...');
        console.log('用户名:', adminData.username);
        const createAdmin = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify(adminData)
        });
        const admin = await createAdmin.json();
        console.log('✅ 租户管理员创建成功');
        console.log('   用户名:', adminData.username);
        console.log('   密码:', adminData.password);
        console.log('   邮箱:', admin.email, '\n');
        
        // 步骤3: 租户管理员登录
        console.log('【步骤3】租户管理员登录...');
        const tenantAdminLogin = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: adminData.username, 
                password: adminData.password 
            })
        });
        const tenantAdminData = await tenantAdminLogin.json();
        tenantAdminToken = tenantAdminData.token;
        console.log('✅ 租户管理员登录成功\n');
        
        // 保存token到全局变量
        window.BDD_TEST_ADMIN_TOKEN = tenantAdminToken;
        window.BDD_TEST_ADMIN_USERNAME = adminData.username;
        window.BDD_TEST_ADMIN_PASSWORD = adminData.password;
        
        console.log('========================================');
        console.log('第二阶段完成：管理员创建与登录');
        console.log('========================================');
        console.log('管理员用户名:', adminData.username);
        console.log('管理员密码:', adminData.password);
        console.log('\n请继续执行第三阶段脚本（创建考试）...');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        if (error.response) {
            console.error('响应:', await error.response.text());
        }
        throw error;
    }
}

// 执行测试
runPhase2();

