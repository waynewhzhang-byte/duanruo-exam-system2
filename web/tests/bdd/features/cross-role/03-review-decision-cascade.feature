# language: zh-CN
@p0 @cross-role @e2e @review-cascade
功能: 审核决策级联验证
  作为系统
  我希望在审核决策后状态正确级联
  以便整个流程不出现不一致

  背景:
    Given 考试 "2026年教师资格考试" 配置为双级审核
    And 考生 "张三" 已提交报名
    And 报名状态为 "PENDING_PRIMARY_REVIEW"
    And Chrome DevTools 浏览器已连接

  @p0 @smoke
  场景: 一审通过→二审通过→审核通过（完整通过流程）
    Given 一审审核员登录
    When 一审审核员通过报名
    Then 报名状态应变更为 "PRIMARY_PASSED"
    And 二审队列应出现该报名

    Given 二审审核员登录
    When 二审审核员通过报名
    Then 报名状态应变更为 "APPROVED"
    And 考生应能看到 "审核通过" 状态
    And 审核通过通知应发送给考生

  @p0
  场景: 一审拒绝→流程终结
    Given 一审审核员登录
    When 一审审核员拒绝报名，原因为 "学历不符合要求"
    Then 报名状态应变更为 "PRIMARY_REJECTED"
    And 报名不应出现在二审队列
    And 考生应能看到 "审核未通过" 和拒绝原因

  @p1
  场景: 一审通过→二审拒绝→流程终结
    Given 一审审核员通过报名
    And 二审审核员登录
    When 二审审核员拒绝报名
    Then 报名状态应变更为 "SECONDARY_REJECTED"
    And 报名不应再出现在任何审核队列
    And 考生应能看到 "审核未通过"

  @p1
  场景: 收费考试审核通过后进入支付流程
    Given 考试 "2026年教师资格考试" 报名费为 100 元
    And 审核通过后
    When 考生查看报名详情
    Then 考生应能看到 "去支付" 按钮
    And 报名状态应为 "APPROVED"（等待支付）