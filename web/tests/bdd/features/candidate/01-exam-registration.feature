# language: zh-CN
功能: 考生考试报名流程
  作为一个考生
  我想注册考试并提交申请
  以便我可以参加考试

  前提条件:
    Given 我是已登录的考生
    And 系统存在开放报名的考试 "2026年教师资格证考试"

  @critical @p0 @candidate @smoke
  场景: 考生成功报名考试
    When 我浏览考试列表页面 "/[tenantSlug]/candidate/exams"
    And 我点击考试 "2026年教师资格证考试"
    And 我选择报考岗位 "初中数学"
    And 我填写报名表单:
      | 字段         | 值                 |
      | fullName     | 张三               |
      | idCardNumber | 110101199001011234|
      | phone        | 13800138000        |
      | email        | zhangsan@email.com |
    And 我上传身份证照片 "id_card.jpg"
    And 我上传学历证书 "diploma.jpg"
    And 我上传证件照 "photo.jpg"
    And 我点击提交报名按钮
    Then 我应该看到报名成功提示 "报名已提交，请等待审核"
    And 我的报名状态应为 "已提交"

  @critical @p0 @candidate
  场景: 考生查看我的报名列表
    Given 我的报名记录:
      | examTitle          | positionTitle | status           |
      | 2026年教师资格证   | 初中数学     | 审核中           |
      | 2026年公务员笔试   | 行政岗       | 已通过           |
    When 我访问报名列表页面 "/[tenantSlug]/candidate/applications"
    Then 我应该看到2条报名记录
    And 第一条记录显示考试 "2026年教师资格证"
    And 第一条记录显示状态 "审核中"

  @p1 @candidate
  场景: 考生查看报名详情
    Given 我是已登录的考生
    And 我有一个报名ID "app-123"
    When 我访问报名详情页 "/[tenantSlug]/candidate/applications/app-123"
    Then 我应该看到考试信息
    And 我应该看到报名信息
    And 我应该看到附件列表
