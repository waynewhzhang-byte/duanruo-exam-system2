# language: zh-CN
功能: 考生缴费
  作为一个考生
  我想支付考试费用
  以便我的报名完成

  @critical @p0 @candidate
  场景: 考生完成微信支付
    Given 我的报名需要缴纳费用 "100元"
    And 我处于待缴费状态
    When 我访问缴费页面 "/[tenantSlug]/candidate/applications/[id]/payment"
    And 我选择支付方式 "微信支付"
    And 我完成支付流程
    Then 我应该看到支付成功提示
    And 我的报名状态应更新为 "已缴费"

  @critical @p0 @candidate
  场景: 考生完成支付宝支付
    Given 我的报名需要缴纳费用 "100元"
    And 我处于待缴费状态
    When 我访问缴费页面
    And 我选择支付方式 "支付宝"
    And 我完成支付流程
    Then 我应该看到支付成功提示

  @p1 @candidate
  场景: 考生查看缴费记录
    Given 我已完成缴费
    When 我访问报名详情页
    Then 我应该看到缴费记录
    And 记录应包含缴费金额、时间和方式
