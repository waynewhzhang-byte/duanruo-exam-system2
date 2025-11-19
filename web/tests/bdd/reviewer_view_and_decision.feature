Feature: 审核查看报名资料并做出决策（通过/拒绝/退回重提）
  作为审核员
  我希望在审核时可以查看候选人提交的附件 并做出审批决定 或退回要求重提

  Background:
    Given 已存在一条候选人已提交的报名 且包含至少1个已确认的附件
    And 我已使用审核员账号登录系统 并选择了目标考试

  @happy
  Scenario: 初审查看附件并通过
    When 我从初审队列拉取一条任务
    And 我打开该申请详情并查看附件列表与下载链接
    And 我提交决策 action "APPROVE" 并填写备注
    Then 该申请状态应从 PENDING_PRIMARY_REVIEW 迁移到 PRIMARY_PASSED 或 PENDING_SECONDARY_REVIEW
    And 审计日志记录 stage=PRIMARY, action=APPROVE

  @happy
  Scenario: 初审退回重提
    When 我从初审队列拉取一条任务
    And 我提交决策 action "RETURN" 并填写退回原因
    Then 该申请状态应从 PENDING_PRIMARY_REVIEW 迁移到 RETURNED_FOR_RESUBMISSION
    And 审计日志记录 stage=PRIMARY, action=RETURN

  @happy
  Scenario: 复审拒绝
    When 我从复审队列拉取一条任务
    And 我提交决策 action "REJECT" 并填写拒绝原因
    Then 该申请状态应从 PENDING_SECONDARY_REVIEW 迁移到 SECONDARY_REJECTED
    And 审计日志记录 stage=SECONDARY, action=REJECT
