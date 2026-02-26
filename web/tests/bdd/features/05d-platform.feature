@p1 @layer-7
Feature: 平台管理

  超级管理员管理租户

  @view-tenants
  Scenario: 查看租户列表
    Given 平台管理员
    When 访问租户管理页
    Then 显示所有租户

  @create-tenant
  Scenario: 创建租户
    Given 平台管理员
    When 创建新租户
    Then 租户创建成功
    Given 自动创建数据库Schema

  @deactivate-tenant
  Scenario: 停用租户
    Given 租户异常
    When 点击"停用"
    Then 租户不可用
