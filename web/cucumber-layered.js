/**
 * Cucumber分层测试配置文件
 * 支持按业务流程依赖关系分层执行BDD测试
 */

const common = {
  require: ['tests/bdd/step-definitions/**/*.ts', 'tests/bdd/support/**/*.ts'],
  requireModule: ['tsx/cjs'],
  formatOptions: {
    snippetInterface: 'async-await'
  },
  parallel: 1,
  timeout: 60000
};

const reportFormat = [
  'progress-bar',
  'html:test-results/bdd/cucumber-report.html',
  'json:test-results/bdd/cucumber-report.json',
  'junit:test-results/bdd/cucumber-report.xml'
];

module.exports = {
  // 默认执行所有测试
  default: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    format: reportFormat
  },

  // ==================== 分层测试配置 ====================

  // 第0层: 基础设施层
  'layer-0': {
    ...common,
    paths: ['tests/bdd/features/00-infrastructure/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/layer-0-infrastructure.html',
      'json:test-results/bdd/layer-0-infrastructure.json'
    ],
    tags: '@layer-0'
  },

  // 第1层: 租户与用户层
  'layer-1': {
    ...common,
    paths: ['tests/bdd/features/01-tenant-user/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/layer-1-tenant-user.html',
      'json:test-results/bdd/layer-1-tenant-user.json'
    ],
    tags: '@layer-1'
  },

  // 第2层: 考试配置层
  'layer-2': {
    ...common,
    paths: ['tests/bdd/features/02-exam-setup/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/layer-2-exam-setup.html',
      'json:test-results/bdd/layer-2-exam-setup.json'
    ],
    tags: '@layer-2'
  },

  // 第3层: 报名流程层
  'layer-3': {
    ...common,
    paths: ['tests/bdd/features/03-registration/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/layer-3-registration.html',
      'json:test-results/bdd/layer-3-registration.json'
    ],
    tags: '@layer-3'
  },

  // 第4层: 支付与准考证层
  'layer-4': {
    ...common,
    paths: ['tests/bdd/features/04-payment-ticket/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/layer-4-payment-ticket.html',
      'json:test-results/bdd/layer-4-payment-ticket.json'
    ],
    tags: '@layer-4'
  },

  // 第5层: 考务管理层
  'layer-5': {
    ...common,
    paths: ['tests/bdd/features/05-exam-ops/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/layer-5-exam-ops.html',
      'json:test-results/bdd/layer-5-exam-ops.json'
    ],
    tags: '@layer-5'
  },

  // 第6层: 成绩管理层
  'layer-6': {
    ...common,
    paths: ['tests/bdd/features/06-score/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/layer-6-score.html',
      'json:test-results/bdd/layer-6-score.json'
    ],
    tags: '@layer-6'
  },

  // 第7层: 端到端集成层
  'layer-7': {
    ...common,
    paths: ['tests/bdd/features/07-e2e/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/layer-7-e2e.html',
      'json:test-results/bdd/layer-7-e2e.json'
    ],
    tags: '@e2e'
  },

  // ==================== 优先级标签配置 ====================

  // 冒烟测试 (跨所有层的关键场景)
  smoke: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/smoke-tests.html',
      'json:test-results/bdd/smoke-tests.json'
    ],
    tags: '@smoke'
  },

  // P0核心功能 (每日回归)
  p0: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    format: reportFormat,
    tags: '@p0'
  },

  // P1重要功能 (发版前)
  p1: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    format: reportFormat,
    tags: '@p1'
  },

  // ==================== 特定业务流程配置 ====================

  // 租户管理流程
  'tenant-flow': {
    ...common,
    paths: ['tests/bdd/features/01-tenant-user/**/*.feature'],
    format: reportFormat,
    tags: '@tenant'
  },

  // 考试配置流程
  'exam-setup-flow': {
    ...common,
    paths: ['tests/bdd/features/02-exam-setup/**/*.feature'],
    format: reportFormat,
    tags: '@exam-setup'
  },

  // 报名审核流程
  'registration-flow': {
    ...common,
    paths: ['tests/bdd/features/03-registration/**/*.feature'],
    format: reportFormat,
    tags: '@registration or @review'
  },

  // 支付流程
  'payment-flow': {
    ...common,
    paths: ['tests/bdd/features/04-payment-ticket/**/*.feature'],
    format: reportFormat,
    tags: '@payment'
  },

  // 安全相关测试
  security: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/security-tests.html',
      'json:test-results/bdd/security-tests.json'
    ],
    tags: '@security'
  },

  // 关键路径测试 (critical)
  critical: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    format: [
      'progress-bar',
      'html:test-results/bdd/critical-tests.html',
      'json:test-results/bdd/critical-tests.json'
    ],
    tags: '@critical'
  }
};
