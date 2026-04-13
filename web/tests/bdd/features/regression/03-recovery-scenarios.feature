# language: zh-CN
@p2 @regression @recovery
功能: 恢复场景验证
  作为系统
  我希望在异常情况下能够优雅恢复

  @p2
  场景: 支付回调超时后订单状态可查询
    Given 支付已发起但回调超时
    When 支付平台最终回调成功
    Then 订单状态应更新为 "SUCCESS"
    And 报名状态应更新为 "PAID"

  @p2
  场景: 文件上传中断后可重新上传
    Given 考生上传证件照片时网络中断
    When 考生重新上传同一文件
    Then 上传应成功
    And 不应有重复的文件记录

  @p2
  场景: 审核任务心跳超时后任务可重新拉取
    Given 审核员拉取任务后浏览器崩溃
    And 10分钟心跳超时
    When 其他审核员拉取任务
    Then 该任务应可被重新拉取
    And 应无数据损坏