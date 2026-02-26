@p1 @layer-6
Feature: 统计分析

  查看各类统计数据

  @application-stats
  Scenario: 报名统计
    Given 租户管理员
    When 查看报名统计
    Then 显示报名趋势图

  @review-stats
  Scenario: 审核统计
    Given 审核管理员
    When 查看审核统计
    Then 显示审核工作量
