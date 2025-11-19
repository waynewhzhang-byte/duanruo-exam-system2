// BDD测试脚本第四阶段：创建考试级别的报名表单模板
// 前置条件：已执行前三阶段脚本

const API_BASE = 'http://localhost:8081/api/v1';

// 从前面阶段获取信息
const tenantId = window.BDD_TEST_TENANT_ID;
const tenantAdminToken = window.BDD_TEST_ADMIN_TOKEN;
const examId = window.BDD_TEST_EXAM_ID;

if (!tenantId || !tenantAdminToken || !examId) {
    console.error('❌ 错误：缺少必要信息，请先执行前面的阶段');
    throw new Error('Missing prerequisites');
}

console.log('使用租户ID:', tenantId);
console.log('使用考试ID:', examId, '\n');

// 报名表单模板
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
            collapsed: false,
            fields: [
                {
                    id: 'fullName',
                    label: '姓名',
                    type: 'text',
                    required: true,
                    order: 1,
                    width: 'half',
                    placeholder: '请输入真实姓名',
                    validation: {
                        minLength: 2,
                        maxLength: 50,
                        pattern: '^[\\u4e00-\\u9fa5a-zA-Z]+$',
                        message: '姓名只能包含中文和英文字母'
                    }
                },
                {
                    id: 'idNumber',
                    label: '身份证号',
                    type: 'text',
                    required: true,
                    order: 2,
                    width: 'half',
                    placeholder: '请输入18位身份证号',
                    validation: {
                        pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
                        message: '请输入有效的身份证号'
                    }
                },
                {
                    id: 'gender',
                    label: '性别',
                    type: 'radio',
                    required: true,
                    order: 3,
                    width: 'half',
                    options: ['男', '女']
                },
                {
                    id: 'birthDate',
                    label: '出生日期',
                    type: 'date',
                    required: true,
                    order: 4,
                    width: 'half'
                },
                {
                    id: 'phone',
                    label: '手机号码',
                    type: 'text',
                    required: true,
                    order: 5,
                    width: 'half',
                    placeholder: '请输入11位手机号',
                    validation: {
                        pattern: '^1[3-9]\\d{9}$',
                        message: '请输入有效的手机号'
                    }
                },
                {
                    id: 'email',
                    label: '电子邮箱',
                    type: 'email',
                    required: true,
                    order: 6,
                    width: 'half',
                    placeholder: 'example@email.com'
                }
            ]
        },
        {
            id: 'education',
            title: '教育背景',
            description: '请填写您的最高学历信息',
            order: 2,
            collapsible: false,
            collapsed: false,
            fields: [
                {
                    id: 'education',
                    label: '最高学历',
                    type: 'select',
                    required: true,
                    order: 1,
                    width: 'half',
                    options: ['高中', '大专', '本科', '硕士', '博士']
                },
                {
                    id: 'major',
                    label: '所学专业',
                    type: 'text',
                    required: true,
                    order: 2,
                    width: 'half',
                    placeholder: '请输入专业名称'
                },
                {
                    id: 'school',
                    label: '毕业院校',
                    type: 'text',
                    required: true,
                    order: 3,
                    width: 'full',
                    placeholder: '请输入毕业院校全称'
                },
                {
                    id: 'graduationDate',
                    label: '毕业时间',
                    type: 'date',
                    required: true,
                    order: 4,
                    width: 'half'
                }
            ]
        },
        {
            id: 'work-experience',
            title: '工作经历',
            description: '请填写您的工作经验（如无可不填）',
            order: 3,
            collapsible: true,
            collapsed: false,
            fields: [
                {
                    id: 'workYears',
                    label: '工作年限',
                    type: 'number',
                    required: false,
                    order: 1,
                    width: 'half',
                    placeholder: '请输入工作年限',
                    validation: {
                        min: 0,
                        max: 50
                    }
                },
                {
                    id: 'currentCompany',
                    label: '当前/最近工作单位',
                    type: 'text',
                    required: false,
                    order: 2,
                    width: 'full',
                    placeholder: '请输入工作单位名称'
                },
                {
                    id: 'currentPosition',
                    label: '当前/最近职位',
                    type: 'text',
                    required: false,
                    order: 3,
                    width: 'half',
                    placeholder: '请输入职位名称'
                }
            ]
        },
        {
            id: 'agreements',
            title: '协议确认',
            order: 4,
            collapsible: false,
            collapsed: false,
            fields: [
                {
                    id: 'agreeToTerms',
                    label: '我已阅读并同意《考试报名须知》和《考生诚信承诺书》',
                    type: 'checkbox',
                    required: true,
                    order: 1,
                    width: 'full'
                }
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
            acceptedFormats: ['.jpg', '.jpeg', '.png'],
            examples: ['身份证正面.jpg', '身份证反面.jpg']
        },
        {
            category: 'education',
            label: '学历证明',
            description: '请上传学历证书或学信网认证报告',
            required: true,
            maxFiles: 2,
            maxFileSize: 10485760,
            acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf'],
            examples: ['学历证书.pdf', '学信网认证报告.pdf']
        }
    ]
};

async function runPhase4() {
    console.log('========================================');
    console.log('BDD测试第四阶段：创建报名表单模板');
    console.log('========================================\n');
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantAdminToken}`,
        'X-Tenant-Id': tenantId
    };
    
    try {
        // 创建考试级别的报名表单模板
        console.log('【步骤1】创建考试级别的报名表单模板...');
        console.log('表单名称:', formTemplate.name);
        console.log('表单版本:', formTemplate.version);
        console.log('表单分区数量:', formTemplate.sections.length);
        console.log('附件要求数量:', formTemplate.fileRequirements.length);
        
        const createFormTemplate = await fetch(`${API_BASE}/exams/${examId}/form-template`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ templateJson: JSON.stringify(formTemplate) })
        });
        
        if (!createFormTemplate.ok) {
            const error = await createFormTemplate.text();
            throw new Error(`创建表单模板失败: ${error}`);
        }
        
        console.log('✅ 报名表单模板创建成功\n');
        
        // 验证表单模板
        console.log('【步骤2】验证表单模板...');
        const getFormTemplate = await fetch(`${API_BASE}/exams/${examId}/form-template`, {
            method: 'GET',
            headers: headers
        });
        
        if (!getFormTemplate.ok) {
            throw new Error('获取表单模板失败');
        }
        
        const savedTemplate = await getFormTemplate.json();
        const parsedTemplate = JSON.parse(savedTemplate.templateJson);
        console.log('✅ 表单模板验证成功');
        console.log('   表单名称:', parsedTemplate.name);
        console.log('   分区数量:', parsedTemplate.sections.length);
        console.log('   总字段数:', parsedTemplate.sections.reduce((sum, s) => sum + s.fields.length, 0));
        
        console.log('\n========================================');
        console.log('🎉 BDD测试全部完成！');
        console.log('========================================');
        console.log('✅ 租户创建成功');
        console.log('✅ 租户激活成功');
        console.log('✅ 管理员账户创建成功');
        console.log('✅ 考试创建成功');
        console.log('✅ 招聘岗位创建成功 (2个岗位)');
        console.log('✅ 考试科目创建成功 (每个岗位2个科目)');
        console.log('✅ 报名表单模板创建成功');
        console.log('\n测试总结:');
        console.log('- 租户ID:', tenantId);
        console.log('- 管理员用户名:', window.BDD_TEST_ADMIN_USERNAME);
        console.log('- 管理员密码:', window.BDD_TEST_ADMIN_PASSWORD);
        console.log('- 考试ID:', examId);
        console.log('- 岗位数量:', window.BDD_TEST_POSITION_IDS.length);
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 执行测试
runPhase4();

