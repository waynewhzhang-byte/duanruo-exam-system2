# language: zh-CN
@p1 @reviewer @edge-case
功能: 审核边界情况
  作为审核员
  我希望在各种边界情况下系统行为正确

  背景:
    Given 我以一级审核员身份登录
    And Chrome DevTools 浏览器已连接

  @p0
  场景: 审核任务锁定超时自动释放
    Given 一审审核员A已拉取任务T1
    And 任务锁定时间已超过10分钟
    When 一审审核员B拉取审核任务
    Then 任务T1应重新出现在审核队列中
    And 审核员B应能拉取任务T1

  @p1
  场景: 审核退回后考生可补充材料
    Given 一审审核员退回某报名，原因为 "材料不完整"
    When 考生登录查看报名详情
    Then 考生应能看到退回原因 "材料不完整"
    And 考生应能重新上传材料

  @p1
  场景: 自动审核通过——全部条件满足
    Given 考试配置了自动审核规则:
      | 规则         | 值       |
      | 年龄下限     | 18       |
      | 年龄上限     | 60       |
      | 学历要求     | 本科及以上|
    And 考生信息完全满足自动审核条件
    When 考生提交报名
    Then 报名状态应自动变为 "APPROVED"
    And 不应出现在审核队列中

  @p1
  场景: 自动审核拒绝——条件不满足
    Given 考试配置了自动审核规则
    And 考生年龄不符合要求
    When 考生提交报名
    Then 报名状态应自动变为 "AUTO_REJECTED"
    And 应显示拒绝原因

  @p0
  场景: 自动审核需人工——边界条件
    Given 考试配置了自动审核规则
    And 考生信息部分满足自动审核条件但需人工判断
    When 考生提交报名
    Then 报名状态应自动变为 "PENDING_PRIMARY_REVIEW"
    And 报名应出现在一审审核队列中

  @p1
  场景: 一审通过自动流转到二审
    Given 审核配置为双级审核
    And 一审审核员通过报名
    When 报名状态变更为 "PRIMARY_PASSED"
    Then 报名应自动出现在二审队列中
    And 一审审核员不应再看到该报名

  @p2
  场景: 二审拒绝后报名流程终结
    Given 二审审核员拒绝报名
    When 报名状态变更为 "SECONDARY_REJECTED"
    Then 考生查看报名应看到 "审核未通过"
    And 考生不应能继续支付或获取准考证