/**
 * 仅运行「租户管理员 API 创建考试」BDD，避免与全量 features 中未实现步骤的场景混在一起。
 *
 * 用法:
 *   cd web && node --env-file=../server/.env ./node_modules/.bin/cucumber-js --config cucumber-tenant-admin-exam.js
 *
 * 环境变量（可选，见 feature 文件说明）:
 *   BDD_TENANT_ADMIN_USER / BDD_TENANT_ADMIN_USERNAME
 *   BDD_TENANT_ADMIN_PASSWORD
 *   BDD_TENANT_CODE（默认 hku）或 BDD_TENANT_ID（直接指定 UUID）
 *   默认租户管理员用户名：hkuadmin
 */
module.exports = {
  default: {
    require: [
      'tests/bdd/step-definitions/**/*.ts',
      'tests/bdd/support/**/*.ts',
    ],
    requireModule: ['tsx/cjs'],
    paths: ['tests/bdd/features/admin/04-tenant-admin-create-exam-api.feature'],
    format: ['progress'],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 1,
    timeout: 120000,
  },
};
