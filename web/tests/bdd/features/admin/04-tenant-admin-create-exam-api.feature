@api @tenant-admin @exam @p0
Feature: Tenant admin creates an exam via API
  租户管理员通过 REST API 在选定租户后创建考试，与前端创建考试共用同一后端契约。
  需要 Nest（默认 http://localhost:8081/api/v1）。
  凭据：BDD_TENANT_ADMIN_USER / BDD_TENANT_ADMIN_PASSWORD；未设置时默认 hkuadmin / zww0625wh（可用环境变量覆盖）。
  租户：BDD_TENANT_CODE（默认 hku）或 BDD_TENANT_ID。

  @tenant-admin-create-exam @smoke
  Scenario: 登录并选定租户后创建一场新考试
    Given 我已以租户管理员身份登录并选定测试租户
    When 我使用 API 以代码前缀 "bdd-exam" 和标题 "BDD 租户管理员创建考试" 创建一场新考试
    Then API 应返回成功且响应中含考试 id 与代码
    And 我应能通过考试 id 查询到该考试且标题一致

  @tenant-admin-create-exam @detailed
  Scenario: 创建含报名窗口、考试日程与费用的详细考试
    Given 我已以租户管理员身份登录并选定测试租户
    When 我使用 API 创建一场字段齐全的 BDD 详细考试
    Then API 应返回成功且响应中含考试 id 与代码
    And 我应能通过考试 id 查询到该考试且详细字段与创建请求一致
