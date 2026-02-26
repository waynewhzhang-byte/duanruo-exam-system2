@p1 @layer-5
Feature: 座位安排

  添加考场、分配座位

  @add-venue
  Scenario: 添加考场
    Given 租户管理员
    When 添加考场信息
    Then 考场创建成功

  @manual-seat-assign
  Scenario: 手动分配座位
    Given 有考生和考场
    When 手动选择座位
    Then 座位分配成功

  @auto-seat-assign
  Scenario: 自动分配座位
    Given 有考生和多个考场
    When 点击"自动分配"
    Then 按策略分配座位
    Given 分配结果可调整
