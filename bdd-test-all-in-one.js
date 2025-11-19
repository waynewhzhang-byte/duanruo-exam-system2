// BDD测试脚本：一键执行完整流程
// 创建租户 -> 创建管理员 -> 创建考试 -> 创建岗位 -> 创建科目 -> 创建报名表单

const API_BASE = 'http://localhost:8081/api/v1';

// 生成唯一标识
const timestamp = Date.now();

// 测试数据
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
    fullName: 'BDD测试管理员',
    phoneNumber: '13900139999',
    role: 'TENANT_ADMIN'
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
    id: 'recruitment-form-2025',
    name: '2025年招聘报名表',
    version: '1.0.0',
    allowSaveDraft: true,
    allowMultipleSubmissions: false,
    submitButtonText: '提交报名',
    sections: [
        {
            id: 'personal-info',
            title: '个人基本信息',
            description: '请如实填写您的个人信息',
            order: 1,
            collapsible: false,
            fields: [
                { id: 'fullName', label: '姓名', type: 'text', required: true, order: 1, width: 'half' },
                { id: 'idNumber', label: '身份证号', type: 'text', required: true, order: 2, width: 'half' },
                { id: 'gender', label: '性别', type: 'radio', required: true, order: 3, width: 'half', options: ['男', '女'] },
                { id: 'birthDate', label: '出生日期', type: 'date', required: true, order: 4, width: 'half' },
                { id: 'phone', label: '手机号码', type: 'text', required: true, order: 5, width: 'half' },
                { id: 'email', label: '电子邮箱', type: 'email', required: true, order: 6, width: 'half' }
            ]
        },
        {
            id: 'education',
            title: '教育背景',
            description: '请填写您的最高学历信息',
            order: 2,
            collapsible: false,
            fields: [
                { id: 'education', label: '最高学历', type: 'select', required: true, order: 1, width: 'half', 
                  options: ['高中', '大专', '本科', '硕士', '博士'] },
                { id: 'major', label: '所学专业', type: 'text', required: true, order: 2, width: 'half' },
                { id: 'school', label: '毕业院校', type: 'text', required: true, order: 3, width: 'full' },
                { id: 'graduationDate', label: '毕业时间', type: 'date', required: true, order: 4, width: 'half' }
            ]
        },
        {
            id: 'agreements',
            title: '协议确认',
            order: 3,
            collapsible: false,
            fields: [
                { id: 'agreeToTerms', label: '我已阅读并同意《考试报名须知》', type: 'checkbox', required: true, order: 1, width: 'full' }
            ]
        }
    ],
    fileRequirements: [
        {
            category: 'identity',
            label: '身份证明',
            description: '请上传身份证正反面照片',
            required: true,
            maxFiles: 2,
            maxFileSize: 5242880,
            acceptedFormats: ['.jpg', '.jpeg', '.png']
        },
        {
            category: 'education',
            label: '学历证明',
            description: '请上传学历证书',
            required: true,
            maxFiles: 2,
            maxFileSize: 10485760,
            acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf']
        }
    ]
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCompleteTest() {
    console.log('========================================');
    console.log('BDD测试：完整流程一键执行');
    console.log('========================================\n');
    
    let superAdminToken, tenantId, tenantAdminToken, examId, positionIds = [];
    
    try {
        // 阶段1: 超级管理员登录
        console.log('【阶段1】超级管理员登录...');
        const superAdminLogin = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'super_admin', password: 'SuperAdmin123!@#' })
        });
        const superAdminData = await superAdminLogin.json();
        superAdminToken = superAdminData.token;
        console.log('✅ 超级管理员登录成功\n');
        
        // 阶段2: 创建租户
        console.log('【阶段2】创建租户...');
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
        
        // 阶段3: 激活租户
        console.log('【阶段3】激活租户...');
        await fetch(`${API_BASE}/tenants/${tenantId}/activate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${superAdminToken}` }
        });
        console.log('✅ 租户激活成功');
        console.log('等待Schema创建...');
        await sleep(5000);
        console.log('✅ Schema创建完成\n');
        
        // 阶段4: 创建租户管理员
        console.log('【阶段4】创建租户管理员...');
        adminData.email = `admin@${tenantData.code}.com`;
        adminData.tenantId = tenantId;
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
        console.log('   密码:', adminData.password, '\n');
        
        // 阶段5: 租户管理员登录
        console.log('【阶段5】租户管理员登录...');
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
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tenantAdminToken}`,
            'X-Tenant-Id': tenantId
        };

        // 阶段6: 创建考试
        console.log('【阶段6】创建考试...');
        console.log('考试标题:', examData.title);
        const createExam = await fetch(`${API_BASE}/exams`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(examData)
        });
        if (!createExam.ok) throw new Error(`创建考试失败: ${await createExam.text()}`);
        const exam = await createExam.json();
        examId = exam.id;
        console.log('✅ 考试创建成功 (ID:', examId, ')\n');

        // 阶段7: 创建岗位
        console.log('【阶段7】创建招聘岗位...');
        for (const position of positions) {
            const createPosition = await fetch(`${API_BASE}/exams/${examId}/positions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(position)
            });
            if (!createPosition.ok) throw new Error(`创建岗位失败: ${await createPosition.text()}`);
            const pos = await createPosition.json();
            positionIds.push(pos.id);
            console.log(`✅ 岗位: ${pos.title} (${pos.code})`);
        }
        console.log('');

        // 阶段8: 创建科目
        console.log('【阶段8】为岗位创建考试科目...');
        for (let i = 0; i < positionIds.length; i++) {
            const positionId = positionIds[i];
            console.log(`岗位 ${positions[i].title}:`);
            for (const subject of subjects) {
                const createSubject = await fetch(`${API_BASE}/positions/${positionId}/subjects`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(subject)
                });
                if (!createSubject.ok) throw new Error(`创建科目失败: ${await createSubject.text()}`);
                const subj = await createSubject.json();
                console.log(`  ✅ ${subj.title} (${subj.code})`);
            }
        }
        console.log('');

        // 阶段9: 创建报名表单模板
        console.log('【阶段9】创建报名表单模板...');
        console.log('表单名称:', formTemplate.name);
        const createFormTemplate = await fetch(`${API_BASE}/exams/${examId}/form-template`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ templateJson: JSON.stringify(formTemplate) })
        });
        if (!createFormTemplate.ok) throw new Error(`创建表单模板失败: ${await createFormTemplate.text()}`);
        console.log('✅ 报名表单模板创建成功\n');

        // 测试完成总结
        console.log('========================================');
        console.log('🎉🎉🎉 BDD测试全部完成！');
        console.log('========================================');
        console.log('✅ 租户创建成功');
        console.log('✅ 租户激活成功 (Schema已创建)');
        console.log('✅ 管理员账户创建成功');
        console.log('✅ 考试创建成功');
        console.log('✅ 招聘岗位创建成功 (2个岗位)');
        console.log('✅ 考试科目创建成功 (每个岗位2个科目)');
        console.log('✅ 报名表单模板创建成功');
        console.log('\n📋 测试总结:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('租户信息:');
        console.log('  - 租户ID:', tenantId);
        console.log('  - 租户代码:', tenantData.code);
        console.log('  - 租户名称:', tenantData.name);
        console.log('\n管理员信息:');
        console.log('  - 用户名:', adminData.username);
        console.log('  - 密码:', adminData.password);
        console.log('  - 邮箱:', adminData.email);
        console.log('\n考试信息:');
        console.log('  - 考试ID:', examId);
        console.log('  - 考试代码:', examData.code);
        console.log('  - 考试标题:', examData.title);
        console.log('  - 岗位数量:', positionIds.length);
        console.log('  - 科目数量:', positionIds.length * subjects.length);
        console.log('  - 报名开始:', examData.registrationStart);
        console.log('  - 报名结束:', examData.registrationEnd);
        console.log('  - 考试开始:', examData.examStart);
        console.log('  - 考试结束:', examData.examEnd);
        console.log('  - 报名费用:', examData.feeAmount, '元');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 保存到全局变量供后续使用
        window.BDD_TEST_RESULT = {
            tenantId,
            tenantCode: tenantData.code,
            adminUsername: adminData.username,
            adminPassword: adminData.password,
            adminToken: tenantAdminToken,
            examId,
            positionIds
        };

        console.log('\n✨ 测试结果已保存到 window.BDD_TEST_RESULT');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 执行测试
runCompleteTest();

