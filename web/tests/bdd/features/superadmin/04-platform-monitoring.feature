# language: zh-CN
@p2 @superadmin @monitoring
功能: 平台监控与统计
  作为超级管理员
  我希望查看平台运营数据
  以便监控平台健康度

  背景:
    Given 我以超级管理员身份登录
    And Chrome DevTools 浏览器已连接

  @p2
  场景: 查看平台总览数据
    When 我访问平台管理首页 "/super-admin"
    Then 我应能看到租户总数
    And 我应能看到活跃租户数
    And 我应能看到平台总用户数

  @p2
  场景: 查看租户维度统计
    When 我访问租户列表 "/super-admin/tenants"
    Then 每个租户行应显示考试数量
    And 每个租户行应显示报名数量
    And 每个租户行应显示状态标签