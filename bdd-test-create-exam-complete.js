// BDD测试脚本第三阶段：创建考试、岗位、科目和表单
// 前置条件：已执行第一、二阶段脚本

const API_BASE = 'http://localhost:8081/api/v1';

// 从前面阶段获取信息
const tenantId = window.BDD_TEST_TENANT_ID;
const tenantAdminToken = window.BDD_TEST_ADMIN_TOKEN;

if (!tenantId || !tenantAdminToken) {
    console.error('❌ 错误：缺少租户ID或管理员Token，请先执行前面的阶段');
    throw new Error('Missing prerequisites');
}

console.log('使用租户ID:', tenantId);
console.log('使用管理员Token:', tenantAdminToken.substring(0, 20) + '...\n');

// 测试数据
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

async function runPhase3() {
    console.log('========================================');
    console.log('BDD测试第三阶段：创建考试及相关配置');
    console.log('========================================\n');
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantAdminToken}`,
        'X-Tenant-Id': tenantId
    };
    
    try {
        // 步骤1: 创建考试
        console.log('【步骤1】创建考试...');
        console.log('考试代码:', examData.code);
        console.log('考试标题:', examData.title);
        const createExam = await fetch(`${API_BASE}/exams`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(examData)
        });
        
        if (!createExam.ok) {
            const error = await createExam.text();
            throw new Error(`创建考试失败: ${error}`);
        }
        
        const exam = await createExam.json();
        const examId = exam.id;
        console.log('✅ 考试创建成功');
        console.log('   考试ID:', examId);
        console.log('   考试代码:', exam.code);
        console.log('   考试标题:', exam.title, '\n');
        
        // 步骤2: 创建岗位
        console.log('【步骤2】创建招聘岗位...');
        const positionIds = [];
        for (const position of positions) {
            console.log(`创建岗位: ${position.title} (${position.code})`);
            const createPosition = await fetch(`${API_BASE}/exams/${examId}/positions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(position)
            });
            
            if (!createPosition.ok) {
                const error = await createPosition.text();
                throw new Error(`创建岗位失败: ${error}`);
            }
            
            const pos = await createPosition.json();
            positionIds.push(pos.id);
            console.log(`✅ 岗位创建成功: ${pos.title} (ID: ${pos.id})`);
        }
        console.log('');
        
        // 步骤3: 为每个岗位创建科目
        console.log('【步骤3】为岗位创建考试科目...');
        for (let i = 0; i < positionIds.length; i++) {
            const positionId = positionIds[i];
            const positionTitle = positions[i].title;
            console.log(`为岗位 ${positionTitle} 创建科目...`);
            
            for (const subject of subjects) {
                const createSubject = await fetch(`${API_BASE}/positions/${positionId}/subjects`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(subject)
                });
                
                if (!createSubject.ok) {
                    const error = await createSubject.text();
                    throw new Error(`创建科目失败: ${error}`);
                }
                
                const subj = await createSubject.json();
                console.log(`  ✅ 科目: ${subj.title} (${subj.code})`);
            }
        }
        console.log('');
        
        // 保存考试ID到全局变量
        window.BDD_TEST_EXAM_ID = examId;
        window.BDD_TEST_POSITION_IDS = positionIds;
        
        console.log('========================================');
        console.log('第三阶段完成：考试、岗位、科目创建');
        console.log('========================================');
        console.log('考试ID:', examId);
        console.log('岗位数量:', positionIds.length);
        console.log('每个岗位的科目数量:', subjects.length);
        console.log('\n请继续执行第四阶段脚本（创建报名表单）...');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 执行测试
runPhase3();

