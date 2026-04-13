# language: zh-CN
@p2 @admin @notification
功能: 通知管理
  作为租户管理员
  我希望配置和管理通知模板
  以便考生在关键节点收到通知

  背景:
    Given 我以租户管理员身份登录
    And Chrome DevTools 浏览器已连接

  @p2
  场景: 查看通知模板列表
    When 我访问通知模板页面 "/[tenantSlug]/admin/notifications/templates"
    Then 我应能看到系统预设的通知模板
    And 每个模板应显示类型、标题、渠道

  @p2
  场景: 编辑通知模板
    Given 存在 "报名成功" 通知模板
    When 我编辑模板内容为 "尊敬的考生，您已成功报名{考试名称}"
    And 我保存
    Then 模板内容应更新
    And 使用该模板的通知应包含新内容