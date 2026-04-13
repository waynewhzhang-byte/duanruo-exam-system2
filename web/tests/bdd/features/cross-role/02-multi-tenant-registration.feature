# language: zh-CN
@p0 @cross-role @e2e @multi-tenant
功能: 多租户报名交叉验证
  作为一个考生
  我希望用同一账户报名不同租户的考试
  以便简化操作

  背景:
    Given 系统中存在两个租户:
      | 租户    | 代码    | 考试               |
      | 教育局  | edu-bj  | 2026年教师资格考试  |
      | 人社局  | hrs-bj  | 2026年公务员笔试    |
    And Chrome DevTools 浏览器已连接

  @p0
  场景: 同一考生报名两个不同租户的考试
    Given 我作为 "candidate1" 注册登录
    When 我访问教育局考试列表 "/edu-bj/candidate/exams"
    And 我报名 "2026年教师资格考试" 的 "初中数学" 岗位
    And 我访问人社局考试列表 "/hrs-bj/candidate/exams"
    And 我报名 "2026年公务员笔试" 的 "行政岗" 岗位
    Then 我的报名列表应显示2条记录
    And 每条记录应显示对应的租户名称

  @p0
  场景: 同一考生无法在同一考试报两个岗位
    Given 我已报名 "2026年教师资格考试" 的 "初中数学" 岗位
    When 我尝试再次报名同一考试的 "初中英语" 岗位
    Then 系统应提示 "您已报名该考试，同一考试只能报考一个岗位"
    And 不应创建第二条报名记录