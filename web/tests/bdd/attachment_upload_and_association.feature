Feature: 报名附件上传与申请关联
  为了支持候选人提交必要的证明材料
  作为候选人
  我希望可以上传文件并与报名申请进行关联

  Background:
    Given 管理员已创建开放中的考试与岗位
    And 已存在候选人用户并成功登录候选人端

  @happy
  Scenario: 获取预签名上传URL并完成上传与确认
    When 候选人请求获取预签名上传URL 用于文件 "身份证.pdf" contentType "application/pdf"
    Then 系统返回可用的 uploadUrl 和 fileId
    When 候选人将文件通过 uploadUrl 直传对象存储
    And 候选人调用 /files/{fileId}/confirm 确认上传
    Then 文件状态为已上传 并可获取下载URL

  @happy
  Scenario: 在提交报名时关联已上传的附件
    Given 候选人已完成至少1个文件上传并确认
    When 候选人提交报名 并在 attachments 中传入 fileId 与 fieldKey
    Then 报名提交成功 且自动审核被触发
    And 申请详情包含该附件的引用

  @negative
  Scenario: 未确认上传直接关联
    Given 候选人已通过 uploadUrl 上传但未确认
    When 在报名 attachments 中引用该 fileId 进行提交
    Then 系统应返回校验错误 或在后续自动审核中标记为无效附件
