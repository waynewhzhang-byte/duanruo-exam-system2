# language: zh-CN
@p0 @cross-cutting @rbac
功能: 角色权限矩阵验证
  作为系统管理员
  我希望每个角色只能访问其权限范围内的功能
  以便确保系统安全

  背景:
    Given Chrome DevTools 浏览器已连接

  # --- 超级管理员权限 ---

  @p0
  场景: 超级管理员可以创建租户
    Given 我以超级管理员身份登录
    When 我访问 "/super-admin/tenants"
    Then 我应能看到 "创建租户" 按钮

  @p0
  场景: 超级管理员可以查看所有租户
    Given 我以超级管理员身份登录
    When 我访问租户列表页面
    Then 我应能看到所有租户的数据

  # --- 租户管理员权限 ---

  @p0
  场景: 租户管理员可以创建考试
    Given 我以租户管理员身份登录
    When 我访问 "/[tenantSlug]/admin/exams"
    Then 我应能看到 "创建考试" 按钮

  @p1
  场景: 租户管理员不能访问超级管理员页面
    Given 我以租户管理员身份登录
    When 我尝试访问 "/super-admin/tenants"
    Then 页面应显示 403 或重定向

  # --- 审核员权限 ---

  @p0
  场景: 一审审核员只能看到一审队列
    Given 我以一级审核员身份登录
    When 我访问 "/[tenantSlug]/reviewer/queue"
    Then 我应只看到一审待审核任务
    And 我不应看到二审队列

  @p0
  场景: 二审审核员只能看到二审队列
    Given 我以二级审核员身份登录
    When 我访问 "/[tenantSlug]/reviewer/queue"
    Then 我应只看到二审待审核任务

  @p1
  场景: 审核员不能创建考试
    Given 我以审核员身份登录
    When 我尝试访问 "/[tenantSlug]/admin/exams"
    Then 我不应看到 "创建考试" 按钮
    And 我应被限制管理功能

  # --- 考生权限 ---

  @p0
  场景: 考生只能报名和查看自己的数据
    Given 我以考生身份登录
    Then 我应能访问考试列表
    And 我应能访问我的报名
    And 我不应能访问管理后台
    And 我不应能访问审核页面