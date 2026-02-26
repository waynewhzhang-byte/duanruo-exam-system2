@p1 @layer-4
Feature: 准考证管理

  生成、查看、下载准考证

  @generate-ticket
  Scenario: 生成准考证
    Given 报名已审核通过
    When 点击"生成准考证"
    Then 准考证生成成功
    Given 状态变为"已发放"

  @batch-generate-tickets
  Scenario: 批量生成准考证
    Given 多个报名已审核通过
    When 选择多个报名
    Given 点击"批量生成"
    Then 批量生成成功

  @download-ticket
  Scenario: 下载准考证
    Given 已有准考证
    When 点击"下载"
    Then 下载PDF文件
