# language: zh-CN
功能: 初审队列
  作为一个一级审核员
  我想查看等待审核的申请
  以便我可以处理它们

  前提条件:
    Given 我是一级审核员

  @critical @p0 @reviewer @smoke
  场景: 初审员查看待审核队列
    Given 存在分配给我的待初审申请
    When 我访问初审队列页面 "/[tenantSlug]/reviewer/queue"
    Then 我应该看到待审核的申请列表
    And 每条记录应显示考生信息、报考岗位、提交时间

  @critical @p0 @reviewer
  场景: 初审员按考试筛选队列
    Given 我在初审队列页面
    When 我选择考试 "2026年教师招聘"
    Then 队列应只显示该考试的申请
