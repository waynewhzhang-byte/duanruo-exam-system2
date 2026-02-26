@smoke @p0 @layer-0
Feature: 用户认证

  超级管理员、租户管理员、考生等不同角色用户登录系统

  @super-admin-login
  Scenario: 超级管理员登录
    Given 系统运行中
    And 数据库中有超级管理员账号 "superadmin/superadmin123"
    When 用户访问登录页面
    And 输入用户名 "superadmin" 和密码 "superadmin123"
    And 点击登录按钮
    Then 登录成功
    And 跳转至平台管理后台 "/super-admin/tenants"

  @tenant-admin-login
  Scenario: 租户管理员登录
    Given 系统运行中
    And 数据库中有租户管理员账号 "admin/admin123"
    And 租户 "demo" 已激活
    When 用户登录
    And 输入用户名 "admin" 和密码 "admin123"
    Then 登录成功
    And 权限包含 "TENANT_ADMIN"
    And 租户角色列表包含租户 "demo"

  @candidate-login
  Scenario: 考生登录
    Given 系统运行中
    And 数据库中有考生账号 "candidate1/candidate123"
    When 用户登录
    And 输入用户名 "candidate1" 和密码 "candidate123"
    Then 登录成功
    And 跳转至考生门户 "/candidate"

  @invalid-login
  Scenario: 错误密码登录失败
    Given 系统运行中
    When 用户输入错误的密码
    Then 登录失败
    And 显示错误提示 "用户名或密码错误"

  @tenant-switch
  Scenario: 租户管理员切换租户
    Given 用户为租户管理员且有多个租户
    When 点击切换租户
    And 选择另一个租户
    Then 权限切换至新租户
    And 页面刷新显示新租户数据
