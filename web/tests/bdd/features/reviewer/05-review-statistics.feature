# language: zh-CN
@p2 @reviewer @statistics
功能: 审核统计
  作为审核员
  我希望查看我的审核工作量统计

  @p2
  场景: 审核员查看个人工作量
    Given 我以审核员身份登录
    When 我查看审核统计页面
    Then 应显示我的审核总数
    And 应显示通过数和拒绝数
    And 应显示平均审核时间

  @p2
  场景: 管理员查看所有审核员统计
    Given 我以租户管理员身份登录
    When 我访问 "/[tenantSlug]/admin/reviews"
    Then 应显示各审核员工作量对比
    And 应显示审核进度统计