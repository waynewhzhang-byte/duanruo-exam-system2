# language: zh-CN
@p1 @admin @ticket
功能: 准考证管理
  作为租户管理员
  我希望生成和管理准考证
  以便考生能参加考试

  背景:
    Given 我以租户管理员身份登录
    And 考试 "2026年教师资格考试" 有审核通过的考生
    And Chrome DevTools 浏览器已连接

  @p1
  场景: 为单个考生生成准考证
    Given 考生A的报名已通过审核
    When 我访问准考证管理页面 "/[tenantSlug]/admin/exams/[examId]/tickets"
    And 我选择考生A
    And 我点击 "生成准考证" 按钮
    Then 准考证应生成成功
    And 准考证号应符合配置的编号规则

  @p1
  场景: 批量生成准考证
    Given 10名考生的报名已通过审核
    When 我点击 "批量生成准考证" 按钮
    And 我确认批量生成
    Then 10张准考证应全部生成
    And 页面应显示生成进度或成功数量

  @p2
  场景: 自定义准考证号生成规则
    Given 考试尚未开始生成准考证
    When 我配置准考证号规则:
      | 规则项           | 值            |
      | customPrefix     | ZG-2026       |
      | includeExamCode  | true          |
      | dateFormat       | YYYYMMDD      |
      | sequenceLength   | 4             |
      | separator        | -             |
    And 我保存规则
    And 我生成准考证
    Then 准考证号格式应为 "ZG-2026-{考试代码}-{日期}-{序号}"

  @p2
  场景: 准证PDF下载
    Given 准考证已生成
    When 我点击 "下载PDF" 按钮
    Then 应下载PDF文件
    And PDF应包含考生姓名、考试信息、考场、座位号

  @p1
  场景: 作废准考证
    Given 考生A的准考证已生成
    When 我点击 "作废" 按钮
    And 我确认作废
    Then 准考证状态应变更为 "CANCELLED"
    And 考生A不应再能看到该准考证