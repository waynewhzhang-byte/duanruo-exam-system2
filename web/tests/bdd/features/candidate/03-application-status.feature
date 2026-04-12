# language: zh-CN
功能: 考生查看报名状态
  作为一个考生
  我想跟踪我的报名状态
  以便我知道进度

  @critical @p0 @candidate
  场景: 考生查看不同状态的报名
    Given 我的报名有以下状态:
      | status                    | 标签        |
      | DRAFT                    | 草稿        |
      | SUBMITTED                | 已提交      |
      | PENDING_PRIMARY_REVIEW   | 初审中      |
      | PRIMARY_PASSED           | 初审通过    |
      | PENDING_SECONDARY_REVIEW | 复审中      |
      | APPROVED                 | 审核通过    |
      | REJECTED                 | 已拒绝      |
    When 我访问报名列表页
    Then 每条记录应显示对应的状态标签

  @p1 @candidate
  场景: 考生查看审核被拒绝的原因
    Given 我的报名状态为 "已拒绝"
    And 拒绝原因为 "学历不符合要求"
    When 我查看报名详情
    Then 我应该看到拒绝原因 "学历不符合要求"
