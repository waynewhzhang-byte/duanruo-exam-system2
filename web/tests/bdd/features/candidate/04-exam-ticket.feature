# language: zh-CN
功能: 考生下载准考证
  作为一个考生
  我想下载我的准考证
  以便我可以参加考试

  @critical @p0 @candidate
  场景: 审核通过后考生下载准考证
    Given 我的报名已通过审核
    And 我已完成缴费
    When 我访问准考证页面 "/[tenantSlug]/candidate/tickets"
    Then 我应该看到我的准考证
    And 我应该能点击下载按钮
    And 下载的应为PDF或图片格式

  @p1 @candidate
  场景: 未通过审核的考生无法下载准考证
    Given 我的报名状态为 "审核中"
    When 我访问准考证页面
    Then 我应该看到提示 "审核通过后可下载准考证"
    And 下载按钮应为禁用状态

  @p1 @candidate
  场景: 未缴费的考生无法下载准考证
    Given 我的报名已通过审核
    But 我尚未完成缴费
    When 我访问准考证页面
    Then 我应该看到提示 "请完成缴费后下载准考证"
