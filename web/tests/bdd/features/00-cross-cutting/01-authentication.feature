# language: zh-CN
@smoke @p0 @cross-cutting @auth
功能: 用户认证与授权
  作为系统用户
  我希望安全地登录和访问系统
  以便我的数据受到保护

  背景:
    Given 系统运行中
    And Chrome DevTools 浏览器已连接

  # --- 登录成功场景 ---

  @smoke @p0
  场景: 超级管理员登录并进入正确页面
    When 我访问登录页面 "/login"
    And 我在用户名输入框填入 "superadmin"
    And 我在密码输入框填入 "superadmin123"
    And 我点击登录按钮
    Then 页面应跳转到超级管理员后台 "/super-admin/tenants"
    And 页面标题应包含 "平台管理"
    And 我应能看到用户头像或用户名 "superadmin"

  @smoke @p0
  场景: 租户管理员登录并选择租户
    When 我访问登录页面 "/login"
    And 我在用户名输入框填入 "admin"
    And 我在密码输入框填入 "admin123"
    And 我点击登录按钮
    Then 我应能看到租户选择界面或直接进入管理后台
    And JWT Token 中角色包含 "TENANT_ADMIN"

  @smoke @p0
  场景: 考生登录并进入考生门户
    When 我访问登录页面 "/login"
    And 我在用户名输入框填入 "candidate1"
    And 我在密码输入框填入 "candidate123"
    And 我点击登录按钮
    Then 页面应跳转到考生门户
    And 我应能看到 "我的报名" 或 "考试列表" 链接

  # --- 登录失败场景 ---

  @p0
  场景: 错误密码登录失败并显示提示
    When 我访问登录页面 "/login"
    And 我在用户名输入框填入 "candidate1"
    And 我在密码输入框填入 "wrongpassword"
    And 我点击登录按钮
    Then 页面应显示错误提示 "用户名或密码错误"
    And 页面应保持在登录页面

  @p1
  场景: 空用户名登录失败
    When 我访问登录页面 "/login"
    And 我不填用户名
    And 我在密码输入框填入 "password123"
    And 我点击登录按钮
    Then 登录按钮应不可点击或显示必填提示

  @p1
  场景: 空密码登录失败
    When 我访问登录页面 "/login"
    And 我在用户名输入框填入 "candidate1"
    And 我不填密码
    And 我点击登录按钮
    Then 登录按钮应不可点击或显示必填提示

  # --- Token 过期与刷新 ---

  @p1
  场景: Token 过期后跳转到登录页
    Given 我已登录为考生
    And 我的 Token 已过期
    When 我尝试访问 "/[tenantSlug]/candidate/applications"
    Then 页面应跳转到登录页
    And 应显示 "登录已过期" 或类似提示

  # --- 路由保护 ---

  @p0
  场景: 未登录用户访问管理后台被重定向
    When 我未登录访问 "/[tenantSlug]/admin/exams"
    Then 页面应重定向到登录页

  @p0
  场景: 考生无法访问管理员页面
    Given 我已登录为考生
    When 我尝试访问 "/[tenantSlug]/admin/exams"
    Then 页面应显示 403 无权限页面或重定向