@p0 @layer-3
Feature: 审核管理

  审核员进行一审、二审审核操作

  @primary-review
  Scenario: 一审审核
    Given 有待一审的报名
    And 审核员进入审核页
    When 查看报名详情
    And 选择"通过"或"拒绝"
    And 填写审核意见
    And 点击提交
    Then 审核记录保存
    And 报名流转至二审或状态更新

  @secondary-review
  Scenario: 二审审核
    Given 有一审通过的报名待二审
    And 审核员进入二审页
    When 审核报名
    Then 最终审核结果生效

  @batch-review
  Scenario: 批量审核
    Given 多条待审核报名
    When 选择多条报名
    And 批量选择"通过"
    And 点击批量提交
    Then 批量审核成功
    And 显示成功条数

  @view-review-history
  Scenario: 查看审核历史
    Given 审核员
    When 查看已审核列表
    Then 显示审核历史记录
    And 包含审核时间、审核人、结果
