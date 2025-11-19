/**
 * 测试数据配置
 */

export const TEST_USERS = {
  admin: {
    username: 'admin',
    email: 'admin@duanruo.com',
    password: 'admin123@Abc',
    fullName: '系统管理员',
    role: 'admin'
  },
  candidate: {
    username: 'test_candidate',
    email: 'candidate@test.com',
    password: 'Test123!@#',
    fullName: '测试候选人',
    role: 'candidate'
  },
  reviewer: {
    username: 'test_reviewer',
    email: 'reviewer@test.com',
    password: 'Test123!@#',
    fullName: '测试审核员',
    role: 'reviewer'
  }
};

export const TEST_EXAM = {
  code: 'E2E_TEST_' + Date.now(),
  title: '端到端测试考试',
  description: '这是一个用于端到端测试的考试',
  registrationStart: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天
  registrationEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
  feeRequired: false
};

export const TEST_POSITION = {
  code: 'POS_' + Date.now(),
  title: '测试岗位',
  description: '这是一个用于测试的岗位',
  quota: 10
};

export const TEST_SUBJECT = {
  name: '专业测试',
  durationMinutes: 120,
  type: 'WRITTEN',
  maxScore: 100,
  passingScore: 60,
  weight: 1.0,
  ordering: 1
};

export const TEST_APPLICATION = {
  formVersion: 1,
  payload: {
    name: '张三',
    age: 25,
    degree: '本科',
    major: '计算机科学与技术',
    phone: '13800138000',
    address: '北京市朝阳区'
  }
};

export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    logout: '/api/v1/auth/logout'
  },
  exams: {
    list: '/api/v1/exams',
    create: '/api/v1/exams',
    detail: (id: string) => `/api/v1/exams/${id}`,
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
    pay: (id: string) => `/api/v1/applications/${id}/pay`
  },
  tickets: {
    generate: (appId: string) => `/api/v1/tickets/application/${appId}/generate`
  }
};

export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  navigation: 30000
};

export const SELECTORS = {
  // 通用选择器
  submitButton: 'button[type="submit"]',
  cancelButton: 'button:has-text("取消")',
  confirmButton: 'button:has-text("确认")',
  
  // 登录页面
  login: {
    usernameInput: 'input[name="username"], input[name="email"]',
    passwordInput: 'input[name="password"]',
    loginButton: 'button:has-text("登录")',
    errorMessage: '[role="alert"]'
  },
  
  // 导航
  nav: {
    adminDashboard: 'a[href="/admin"]',
    candidateDashboard: 'a[href="/candidate"]',
    reviewerDashboard: 'a[href="/reviewer"]',
    logout: 'button:has-text("退出登录")'
  },
  
  // 考试管理
  exam: {
    createButton: 'button:has-text("创建考试")',
    codeInput: 'input[name="code"]',
    titleInput: 'input[name="title"]',
    descriptionInput: 'textarea[name="description"]',
    openButton: 'button:has-text("开放报名")',
    closeButton: 'button:has-text("关闭报名")'
  },
  
  // 岗位管理
  position: {
    createButton: 'button:has-text("添加岗位")',
    codeInput: 'input[name="code"]',
    titleInput: 'input[name="title"]',
    quotaInput: 'input[name="quota"]'
  },
  
  // 申请管理
  application: {
    applyButton: 'button:has-text("立即报名")',
    nameInput: 'input[name="name"]',
    ageInput: 'input[name="age"]',
    degreeSelect: 'select[name="degree"]',
    payButton: 'button:has-text("支付")'
  }
};
