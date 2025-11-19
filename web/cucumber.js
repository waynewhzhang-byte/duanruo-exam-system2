/**
 * Cucumber配置文件
 * 用于BDD测试
 */

const common = {
  require: ['tests/bdd/step-definitions/**/*.ts', 'tests/bdd/support/**/*.ts'],
  requireModule: ['tsx/cjs'],
  format: [
    'progress-bar',
    'html:test-results/bdd/cucumber-report.html',
    'json:test-results/bdd/cucumber-report.json',
    'junit:test-results/bdd/cucumber-report.xml'
  ],
  formatOptions: {
    snippetInterface: 'async-await'
  },
  parallel: 1,
  timeout: 60000 // 增加步骤超时时间到60秒（从30秒增加）
};

module.exports = {
  default: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature']
  },
  smoke: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    tags: '@smoke'
  },
  p0: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    tags: '@p0'
  },
  p1: {
    ...common,
    paths: ['tests/bdd/features/**/*.feature'],
    tags: '@p1'
  }
};

