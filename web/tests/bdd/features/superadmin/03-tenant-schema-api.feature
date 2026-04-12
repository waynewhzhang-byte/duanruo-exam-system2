# 与 Nest 同一 Postgres：DATABASE_URL（与 server/.env 一致）
# API：API_BASE 默认 http://localhost:8081/api/v1
# 超管：export BDD_SUPERADMIN_PASSWORD=...（勿提交生产密码）
# 可选：BDD_SUPERADMIN_USER（默认 superadmin）
Feature: Super admin creates tenant and PostgreSQL schema is complete
  As automated acceptance
  I want to create a tenant via API and verify the per-tenant schema with SQL

  @integration @requires-db @tenant-schema
  Scenario: API creates tenant and full tenant schema exists in database
    Given DATABASE_URL 已配置以便直连校验 schema
    And 我已通过 API 以超级管理员身份登录
    When 我通过 API 创建新租户（自动生成唯一 code）
    Then API 应返回成功且 data 中含 tenant 记录与预期 schema_name
    And 使用 SQL 应能查到 public.tenants 中对应 code 的行
    And 使用 SQL 应存在该租户的专属 schema
    And 该 schema 下应存在 init-tables 定义的全部业务表

  @integration @requires-db @tenant-admin-api
  Scenario: API creates tenant then tenant admin user with DB binding
    Given DATABASE_URL 已配置以便直连校验 schema
    And 我已通过 API 以超级管理员身份登录
    When 我通过 API 创建新租户（自动生成唯一 code）
    And 我通过 API 在该租户下创建租户管理员账户（自动生成用户名与邮箱）
    Then 创建用户 API 应返回成功且 data 中含用户 id 且无 passwordHash
    And 使用 SQL 应在 public.users 中查到该租户管理员
    And 使用 SQL 应在 public.user_tenant_roles 中查到该用户对该租户的 TENANT_ADMIN 绑定
