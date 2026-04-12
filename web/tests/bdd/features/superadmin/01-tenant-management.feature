# language: zh-CN
功能: 租户管理
  作为一个超级管理员
  我想管理租户
  以便我可以创建和控制平台租户

  前提条件:
    Given 我是超级管理员

  @critical @p0 @superadmin @smoke
  场景: 超管创建新租户
    Given 我在租户管理页面 "/super-admin/tenants"
    When 我点击创建租户按钮
    And 我填写租户信息:
      | 字段          | 值              |
      | name          | 北京市教育局     |
      | slug          | beijing-edu     |
      | contactEmail  | admin@beijing.edu |
      | contactPhone  | 010-12345678   |
    And 我点击保存
    Then 租户应创建成功
    And 租户应显示在列表中

  @critical @p0 @superadmin
  场景: 超管激活租户
    Given 存在待激活租户 "测试租户"
    When 我点击激活按钮
    Then 租户状态应变为 "ACTIVE"
    And 租户可以正常登录

  @critical @p0 @superadmin
  场景: 超管停用租户
    Given 租户 "测试租户" 处于激活状态
    When 我点击停用按钮
    And 我确认停用
    Then 租户状态应变为 "INACTIVE"
    And 租户无法登录

  @p1 @superadmin
  场景: 超管删除租户
    Given 租户无活跃数据
    When 我删除该租户
    And 我确认删除
    Then 租户应被彻底删除
