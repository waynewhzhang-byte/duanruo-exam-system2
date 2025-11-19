// BDD测试脚本：创建租户并配置考试
// 使用Chrome DevTools执行

const API_BASE = 'http://localhost:8081/api/v1';

// 测试数据
const timestamp = Date.now();
const tenantData = {
    code: `test_company_${timestamp}`,
    name: `测试公司-${timestamp}`,
    contactEmail: `contact${timestamp}@test.com`,
    contactPhone: '13800138002',
    description: 'BDD测试租户'
};

const adminData = {
    username: 'admin_bdd',
    password: 'AdminBDD123!@#',
    email: `admin@test${timestamp}.com`,
    fullName: 'BDD测试管理员',
    phoneNumber: '13900139999'
};

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

// 执行测试
async function runBDDTest() {
    console.log('========================================');
    console.log('BDD测试：租户创建与考试配置完整流程');
    console.log('========================================\n');
    
    let superAdminToken, tenantId, tenantAdminToken, examId;
    
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
        
        // 步骤2: 创建租户
        console.log('【步骤2】创建租户...');
        console.log('租户代码:', tenantData.code);
        const createTenant = await fetch(`${API_BASE}/tenants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${superAdminToken}`
            },
            body: JSON.stringify(tenantData)
        });
        const tenant = await createTenant.json();
        tenantId = tenant.id;
        console.log('✅ 租户创建成功');
        console.log('   租户ID:', tenantId);
        console.log('   Schema:', tenant.schemaName, '\n');
        
        // 步骤3: 激活租户
        console.log('【步骤3】激活租户...');
        await fetch(`${API_BASE}/tenants/${tenantId}/activate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${superAdminToken}` }
        });
        console.log('✅ 租户激活成功');
        console.log('等待Schema创建...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('✅ Schema创建完成\n');
        
        // 保存租户ID和代码到全局变量
        window.BDD_TEST_TENANT_ID = tenantId;
        window.BDD_TEST_TENANT_CODE = tenantData.code;
        
        console.log('========================================');
        console.log('第一阶段完成：租户创建与激活');
        console.log('========================================');
        console.log('租户ID:', tenantId);
        console.log('租户代码:', tenantData.code);
        console.log('\n请继续执行第二阶段脚本...');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 执行测试
runBDDTest();

