# language: zh-CN
@p2 @admin @analytics
功能: 统计分析
  作为租户管理员
  我希望查看考试和报名的统计数据
  以便做出运营决策

  背景:
    Given 我以租户管理员身份登录
    And 考试 "2026年教师资格考试" 有报名数据
    And Chrome DevTools 浏览器已连接

  @p2
  场景: 查看报名统计总览
    When 我访问统计页面 "/[tenantSlug]/admin/analytics"
    Then 我应能看到报名总数
    And 我应能看到各状态分布（草稿、已提交、审核中、已通过、已拒绝）
    And 我应能看到各岗位报名人数

  @p2
  场景: 查看报名趋势数据
    When 我切换到趋势视图
    Then 我应能看到按天的报名趋势图
    And 我应能看到按岗位的报名分布

  @p2
  场景: 查看审核工作量统计
    When 我访问 "/[tenantSlug]/admin/analytics/applications"
    Then 我应能看到审核通过率
    And 我应能看到各审核员工作量对比