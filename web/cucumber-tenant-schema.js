/**
 * 仅运行「超管创建租户 + SQL 校验 schema」BDD，避免与全量 features 的 paths 合并。
 */
module.exports = {
  default: {
    require: [
      'tests/bdd/step-definitions/**/*.ts',
      'tests/bdd/support/**/*.ts',
    ],
    requireModule: ['tsx/cjs'],
    paths: ['tests/bdd/features/superadmin/03-tenant-schema-api.feature'],
    format: ['progress'],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 1,
    timeout: 120000,
  },
};
