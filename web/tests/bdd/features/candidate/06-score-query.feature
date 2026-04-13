# language: zh-CN
@p3 @candidate @score
功能: 考生成绩查询
  作为考生
  我希望查询我的考试成绩
  以便了解录取结果

  背景:
    Given 我已登录为考生
    And 考试 "2026年教师资格考试" 成绩已发布
    And Chrome DevTools 浏览器已连接

  @p3
  场景: 查看笔试成绩
    When 我访问成绩页面 "/[tenantSlug]/candidate/scores"
    Then 我应能看到各科目成绩:
      | 科目     | 成绩  | 是否通过 |
      | 行政能力 | 75.0  | 通过     |
      | 申论     | 68.5  | 通过     |
    And 我应能看到笔试总分
    And 我应能看到笔试是否通过

  @p3
  场景: 查看面试结果
    Given 笔试已通过且面试成绩已录入
    When 我查看成绩页面
    Then 我应能看到面试成绩
    And 我应能看到最终结果 "面试通过" 或 "面试未通过"

  @p3
  场景: 成绩未发布时显示提示
    Given 成绩尚未发布
    When 我访问成绩页面
    Then 应显示 "成绩尚未公布" 或类似提示