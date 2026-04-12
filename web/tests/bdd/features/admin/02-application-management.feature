# language: zh-CN
功能: 报名管理
  作为一个租户管理员
  我想查看和管理报名申请
  以便我可以监督审核过程

  @critical @p0 @admin
  场景: 管理员查看报名列表
    Given 我是租户管理员
    When 我访问报名列表页面 "/[tenantSlug]/admin/applications"
    Then 我应该看到所有报名记录
    And 可以按考试、状态筛选

  @p1 @admin
  场景: 管理员查看报名详情
    Given 存在报名申请
    When 我点击查看详情
    Then 我应该看到完整的报名信息
    And 我应该看到附件材料

  @p2 @admin
  场景: 管理员导出报名数据
    Given 我在报名列表页面
    When 我点击导出按钮
    And 我选择导出格式 "Excel"
    Then 我应该能下载报名数据文件
