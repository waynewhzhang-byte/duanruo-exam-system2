# language: zh-CN
功能: 复审流程
  作为一个二级审核员
  我想进行二级审核
  以便我可以对申请做出最终决定

  前提条件:
    Given 我是二级审核员

  @critical @p0 @reviewer @smoke
  场景: 复审员查看待复审队列
    When 我访问复审队列页面 "/[tenantSlug]/reviewer/queue"
    Then 我应该看到待复审的申请列表
    And 这些申请已通过初审

  @critical @p0 @reviewer
  场景: 复审员最终审核通过
    Given 我在复审详情页
    And 申请已通过初审
    When 我审核通过该申请
    Then 申请状态应变为 "审核通过"
    And 考生应收到审核通过通知

  @critical @p0 @reviewer
  场景: 复审员最终审核拒绝
    Given 我在复审详情页
    When 我审核拒绝该申请
    And 填写拒绝原因
    Then 申请状态应变为 "审核拒绝"
    And 考生应收到审核拒绝通知
