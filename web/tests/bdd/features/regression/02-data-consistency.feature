# language: zh-CN
@p2 @regression @consistency
功能: 数据一致性验证
  作为系统
  我希望在各种操作后数据保持一致

  @p2
  场景: 审核通过后报名状态与审核记录一致
    Given 一审通过报名后二审也通过
    When 我通过API查询报名状态
    Then Application.status 应为 "APPROVED"
    And Review 表应有一条 PRIMARY_PASSED 记录
    And Review 表应有一条 APPROVED 记录
    And ApplicationAuditLog 应记录两次状态变更

  @p2
  场景: 支付成功后订单状态与报名状态一致
    Given 支付成功
    When 我通过API查询
    Then PaymentOrder.status 应为 "SUCCESS"
    And Application.status 应为 "PAID"
    And PaymentOrder.amount 应等于 exam.feeAmount

  @p2
  场景: 座位分配后准考证与座位信息一致
    Given 座位已分配
    When 我查询准考证信息
    Then Ticket.venueName 应等于 SeatAssignment.venueName
    And Ticket.roomNumber 应等于 SeatAssignment.roomNumber
    And Ticket.seatNumber 应等于 SeatAssignment.seatNumber