# language: zh-CN
@p3 @admin @score
功能: 成绩管理
  作为租户管理员
  我希望管理考试成绩和面试结果
  以便完成录用流程

  背景:
    Given 我以租户管理员身份登录
    And 考试 "2026年教师资格考试" 已结束
    And Chrome DevTools 浏览器已连接

  @p3
  场景: CSV导入笔试成绩
    When 我访问成绩管理页面 "/[tenantSlug]/admin/scores"
    And 我点击 "导入成绩" 按钮
    And 我上传 CSV 文件 "scores.csv"
    Then 系统应解析并显示导入预览
    When 我确认导入
    Then 成绩应导入成功
    And 每个考生的笔试总分应自动计算

  @p3
  场景: 手动录入面试成绩
    Given 考生A笔试已通过
    When 我为考生A录入面试成绩:
      | 字段                    | 值     |
      | interviewScore         | 85.5   |
      | interviewEligibility   | PASSED |
    And 我保存
    Then 面试成绩应录入成功
    And 考生A的最终结果应更新为 "面试通过"

  @p3
  场景: 设置笔试及格线
    When 我设置笔试及格分数线为 60 分
    Then 分数低于60的考生 interviewEligibility 应自动设为 "FAILED"
    And 分数达到60的考生 interviewEligibility 应自动设为 "ELIGIBLE"

  @p3
  场景: 考生查看成绩
    Given 成绩已发布
    When 考生登录并访问 "/[tenantSlug]/candidate/scores"
    Then 应显示各科目成绩
    And 应显示总成绩
    And 应显示是否通过