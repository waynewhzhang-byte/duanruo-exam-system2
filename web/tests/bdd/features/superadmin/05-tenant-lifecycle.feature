# language: zh-CN
@p1 @superadmin @lifecycle
功能: 租户全生命周期管理
  作为超级管理员
  我希望管理租户从创建到停用的完整生命周期

  背景:
    Given 我以超级管理员身份登录
    And Chrome DevTools 浏览器已连接

  @p0
  场景: 创建租户并自动创建Schema和Bucket
    When 我访问租户管理页面 "/super-admin/tenants"
    And 我点击 "创建租户" 按钮
    And 我填写租户信息:
      | 字段          | 值              |
      | name          | 测试租户全流程  |
      | code          | test-lifecycle  |
      | contactEmail  | test@lifecycle.com |
      | contactPhone  | 13800138000    |
    And 我点击保存
    Then 租户应创建成功
    And 系统应自动创建 PostgreSQL schema "tenant_test_lifecycle"
    And 系统应自动创建 MinIO bucket "tenant-test-lifecycle-files"
    And 新租户应出现在列表中
    And 新租户状态应为 "PENDING"

  @p0
  场景: 激活租户使其可正常使用
    Given 存在待激活租户 "test-lifecycle"
    When 我点击激活按钮
    Then 租户状态应变更为 "ACTIVE"
    And 租户管理员应能正常登录
    And 租户下可创建考试

  @p1
  场景: 停用租户使其不可用
    Given 租户 "test-lifecycle" 处于 ACTIVE 状态
    When 我点击停用按钮
    And 我在确认对话框中点击确认
    Then 租户状态应变更为 "INACTIVE"
    And 该租户下的考试应不再对外显示
    And 该租户下的考生应无法登录

  @p1
  场景: 重新激活已被停用的租户
    Given 租户 "test-lifecycle" 处于 INACTIVE 状态
    When 我点击重新激活按钮
    Then 租户状态应变更为 "ACTIVE"
    And 该租户下原有数据应保持不变

  @p2
  场景: 删除无活跃数据的租户
    Given 租户 "empty-tenant" 无任何报名和考试数据
    When 我点击删除按钮
    And 我在确认对话框中输入租户代码 "empty-tenant" 确认
    Then 租户应被彻底删除
    And 删除后租户列表不再显示该租户

  @p1
  场景: 无法删除有活跃数据的租户
    Given 租户 "busy-tenant" 有活跃考试数据
    When 我点击删除按钮
    Then 系统应提示 "该租户存在活跃数据，无法删除"
    And 删除按钮应不可用或点击后提示无法删除