# language: zh-CN
功能: 考试管理
  作为一个租户管理员
  我想创建和管理考试
  以便考生可以报名

  前提条件:
    Given 我是租户管理员

  @critical @p0 @admin @smoke
  场景: 管理员创建新考试
    Given 我在考试管理页面 "/[tenantSlug]/admin/exams"
    When 我点击创建考试按钮
    And 我填写考试信息:
      | 字段            | 值                    |
      | title           | 2026年春季教师招聘考试 |
      | description     | 全市教师统一招聘考试   |
      | examStart       | 2026-04-15 09:00     |
      | examEnd         | 2026-04-15 11:00     |
      | registrationStart| 2026-03-01 00:00    |
      | registrationEnd  | 2026-03-31 23:59    |
    And 我点击保存按钮
    Then 我应该看到考试创建成功提示
    And 新考试应显示在考试列表中

  @critical @p0 @admin
  场景: 管理员编辑考试
    Given 考试 "2026年春季教师招聘考试" 已存在
    When 我编辑该考试的描述
    And 我保存更改
    Then 考试信息应更新成功

  @p1 @admin
  场景: 管理员删除考试
    Given 考试 "测试考试" 存在且无报名
    When 我删除该考试
    And 我确认删除
    Then 考试应从列表中移除

  @p1 @admin
  场景: 管理员管理考试岗位
    Given 考试已创建
    When 我进入岗位管理
    And 我添加岗位 "初中数学教师"
    And 我设置招聘人数 "10人"
    And 我设置报名费 "100元"
    Then 岗位应创建成功
