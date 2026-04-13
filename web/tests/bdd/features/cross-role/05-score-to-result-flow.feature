# language: zh-CN
@p3 @cross-role @e2e @score-result
功能: 成绩到录用结果全流程
  作为租户管理员和考生
  我希望成绩管理流程完整关联到最终结果

  背景:
    Given 考试 "2026年教师资格考试" 已结束
    And 笔试及格线为 60 分
    And Chrome DevTools 浏览器已连接

  @p3
  场景: 成绩录入→及格判定→面试资格→最终结果
    Given 10名考生参加了考试
    When 管理员通过 CSV 导入笔试成绩
    And 系统自动进行及格判定:
      | 考生 | 笔试总分 | 是否通过笔试 |
      | 张三 | 85      | 是         |
      | 李四 | 55      | 否         |
      | 王五 | 92      | 是         |
    Then 笔试通过的考生 interviewEligibility 应为 "ELIGIBLE"
    And 笔试未通过的考生 interviewEligibility 应为 "FAILED"

    When 管理员录入面试成绩:
      | 考生 | 面试成绩 | 最终结果   |
      | 张三 | 80      | 面试通过   |
      | 王五 | 58      | 面试未通过 |

    Then 考生张三最终结果应为 "面试通过"
    And 考生李四最终结果应为 "笔试未通过"
    And 考生王五最终结果应为 "面试未通过"

    When 各考生登录查看成绩
    Then 张三应看到 "通过"
    And 李四应看到 "笔试未通过"
    And 王五应看到 "面试未通过"