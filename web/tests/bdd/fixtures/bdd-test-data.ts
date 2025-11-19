/**
 * BDD测试数据配置
 */

export const BDD_TEST_USERS = {
  superAdmin: {
    username: 'super_admin',
    email: 'super_admin@duanruo.com',
    password: 'SuperAdmin123!@#',
    role: 'SUPER_ADMIN',
    fullName: '超级管理员'
  },
  
  tenantAdmin: {
    username: 'tenant_admin',
    email: 'tenant_admin@test-company.com',
    password: 'TenantAdmin123!@#',
    role: 'TENANT_ADMIN',
    fullName: '租户管理员'
  },
  
  candidate: {
    username: 'bdd_candidate',
    email: 'bdd_candidate@test.com',
    password: 'Candidate123!@#',
    role: 'CANDIDATE',
    fullName: '张三',
    realName: '张三',
    idCard: '110101199001011234',
    phone: '13800138000',
    gender: '男',
    birthDate: '1990-01-01',
    education: '本科',
    major: '计算机科学与技术',
    graduationSchool: '清华大学',
    graduationDate: '2020-06'
  },
  
  reviewer1: {
    username: 'bdd_reviewer1',
    email: 'reviewer1@test-company.com',
    password: 'Reviewer123!@#',
    role: 'PRIMARY_REVIEWER',
    fullName: '一级审核员'
  },
  
  reviewer2: {
    username: 'bdd_reviewer2',
    email: 'reviewer2@test-company.com',
    password: 'Reviewer123!@#',
    role: 'SECONDARY_REVIEWER',
    fullName: '二级审核员'
  }
};

export const BDD_TEST_TENANT = {
  name: '测试企业A',
  slug: 'test-company-a',
  domain: 'test-company-a.duanruo.com',
  contactName: '张经理',
  contactPhone: '13800138001',
  contactEmail: 'zhang@test-a.com',
  status: 'ACTIVE'
};

export const BDD_TEST_EXAM = {
  code: 'EXAM-BDD-2025-SPRING',
  title: '2025年春季招聘考试',
  description: 'BDD测试专用考试',
  examType: '招聘考试',
  registrationStart: '2025-11-01 09:00:00',
  registrationEnd: '2025-11-30 18:00:00',
  examStart: '2025-12-15 09:00:00',
  examEnd: '2025-12-15 11:00:00',
  feeRequired: true,
  feeAmount: 100.00,
  status: 'DRAFT'
};

export const BDD_TEST_POSITIONS = [
  {
    code: 'DEV001',
    title: '软件开发工程师',
    description: '负责系统开发和维护',
    quota: 10,
    requirements: {
      education: '本科及以上',
      major: '计算机相关专业',
      age: '18-35岁',
      gender: null
    }
  },
  {
    code: 'TEST001',
    title: '测试工程师',
    description: '负责软件测试工作',
    quota: 5,
    requirements: {
      education: '本科及以上',
      major: '计算机相关专业',
      age: '18-35岁',
      gender: null
    }
  }
];

export const BDD_TEST_SUBJECTS = [
  {
    code: 'SUBJECT-001',
    name: '专业知识',
    totalScore: 100,
    passingScore: 60
  },
  {
    code: 'SUBJECT-002',
    name: '综合能力',
    totalScore: 100,
    passingScore: 60
  }
];

export const BDD_TEST_FORM_FIELDS = [
  {
    name: 'realName',
    label: '姓名',
    type: 'text',
    required: true,
    validation: '2-20个字符'
  },
  {
    name: 'idCard',
    label: '身份证号',
    type: 'text',
    required: true,
    validation: '18位身份证号'
  },
  {
    name: 'phone',
    label: '手机号',
    type: 'text',
    required: true,
    validation: '11位手机号'
  },
  {
    name: 'email',
    label: '邮箱',
    type: 'email',
    required: true,
    validation: '有效邮箱格式'
  },
  {
    name: 'education',
    label: '学历',
    type: 'select',
    required: true,
    options: ['高中', '专科', '本科', '硕士', '博士']
  },
  {
    name: 'graduationSchool',
    label: '毕业院校',
    type: 'text',
    required: true
  },
  {
    name: 'major',
    label: '专业',
    type: 'text',
    required: true
  }
];

export const BDD_TEST_ATTACHMENTS = [
  {
    name: '身份证扫描件',
    type: 'ID_CARD',
    fileTypes: ['PDF', 'JPG', 'PNG'],
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true
  },
  {
    name: '学历证明',
    type: 'DIPLOMA',
    fileTypes: ['PDF', 'JPG', 'PNG'],
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true
  },
  {
    name: '个人简历',
    type: 'RESUME',
    fileTypes: ['PDF', 'DOC', 'DOCX'],
    maxSize: 10 * 1024 * 1024, // 10MB
    required: false
  }
];

export const BDD_TEST_REVIEW_RULES = [
  {
    name: '年龄限制',
    type: 'AGE',
    condition: '18-35岁',
    action: 'PASS'
  },
  {
    name: '学历要求',
    type: 'EDUCATION',
    condition: '本科及以上',
    action: 'PASS'
  },
  {
    name: '专业限制',
    type: 'MAJOR',
    condition: '计算机相关',
    action: 'PASS'
  }
];

export const BDD_TEST_VENUE = {
  name: '第一考场',
  address: '北京市海淀区中关村大街1号',
  capacity: 100,
  rooms: [
    {
      name: '101教室',
      code: 'ROOM-101',
      capacity: 50
    },
    {
      name: '102教室',
      code: 'ROOM-102',
      capacity: 50
    }
  ]
};

export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    logout: '/api/v1/auth/logout'
  },
  tenants: {
    list: '/api/v1/tenants',
    create: '/api/v1/tenants',
    detail: (id: string) => `/api/v1/tenants/${id}`,
    update: (id: string) => `/api/v1/tenants/${id}`,
    disable: (id: string) => `/api/v1/tenants/${id}/disable`
  },
  exams: {
    list: '/api/v1/exams',
    create: '/api/v1/exams',
    detail: (id: string) => `/api/v1/exams/${id}`,
    update: (id: string) => `/api/v1/exams/${id}`,
    open: (id: string) => `/api/v1/exams/${id}/open`,
    close: (id: string) => `/api/v1/exams/${id}/close`
  },
  positions: {
    list: (examId: string) => `/api/v1/exams/${examId}/positions`,
    create: (examId: string) => `/api/v1/exams/${examId}/positions`,
    detail: (id: string) => `/api/v1/positions/${id}`
  },
  applications: {
    list: '/api/v1/applications',
    create: '/api/v1/applications',
    detail: (id: string) => `/api/v1/applications/${id}`,
    submit: (id: string) => `/api/v1/applications/${id}/submit`,
    pay: (id: string) => `/api/v1/applications/${id}/pay`
  },
  reviews: {
    pending: '/api/v1/reviews/pending',
    approve: (id: string) => `/api/v1/reviews/${id}/approve`,
    reject: (id: string) => `/api/v1/reviews/${id}/reject`
  },
  tickets: {
    generate: (appId: string) => `/api/v1/tickets/application/${appId}/generate`,
    download: (id: string) => `/api/v1/tickets/${id}/download`
  },
  scores: {
    create: '/api/v1/scores',
    list: (examId: string) => `/api/v1/exams/${examId}/scores`,
    publish: (examId: string) => `/api/v1/exams/${examId}/scores/publish`
  }
};

export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  navigation: 30000
};

