# language: zh-CN
@p2 @candidate @notification
功能: 考生通知接收
  作为考生
  我希望及时收到各种状态变更通知
  以便了解报名进展

  背景:
    Given 我已登录为考生
    And Chrome DevTools 浏览器已连接

  @p2
  场景: 报名提交成功通知
    When 我成功提交报名
    Then 我应能在通知中心看到 "报名已提交" 通知

  @p2
  场景: 审核通过通知
    Given 我的报名已通过审核
    Then 我应能在通知中心看到 "审核通过" 通知
    And 通知应包含考试名称

  @p2
  场景: 准证生成通知
    Given 我的准考证已生成
    Then 我应能在通知中心看到 "准考证已发放" 通知

  @p2
  场景: 成绩发布通知
    Given 成绩已发布
    Then 我应能在通知中心看到 "成绩已公布" 通知