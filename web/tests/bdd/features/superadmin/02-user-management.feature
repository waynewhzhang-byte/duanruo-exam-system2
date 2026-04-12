# language: zh-CN
功能: 平台用户管理
  作为一个超级管理员
  我想管理平台用户
  以便我可以分配角色和权限

  @critical @p0 @superadmin @smoke
  场景: 超管创建租户管理员
    Given 我在用户管理页面 "/super-admin/users"
    When 我点击创建用户按钮
    And 我选择角色 "租户管理员"
    And 我填写用户信息:
      | 字段      | 值           |
      | username  | admin1      |
      | email     | admin1@co.com |
      | password  | Test123!    |
      | fullName  | 管理员一    |
    And 我选择所属租户 "北京市教育局"
    And 我点击保存
    Then 用户应创建成功

  @critical @p0 @superadmin
  场景: 超管创建系统管理员
    Given 我在用户管理页面
    When 我创建角色为 "超级管理员" 的用户
    Then 该用户应有平台最高权限

  @critical @p0 @superadmin
  场景: 超管创建审核员
    Given 我在用户管理页面
    When 我创建角色为 "初审员" 的用户
    And 我选择所属租户 "北京市教育局"
    Then 用户应被创建为该租户的初审员

  @p1 @superadmin
  场景: 超管查看用户列表
    Given 系统存在多个用户
    When 我访问用户管理页面
    Then 我应该看到所有用户列表
    And 可以按角色筛选

  @p2 @superadmin
  场景: 超管编辑用户信息
    Given 存在用户 "admin1"
    When 我编辑该用户的信息
    And 我修改邮箱地址
    Then 用户信息应更新成功
