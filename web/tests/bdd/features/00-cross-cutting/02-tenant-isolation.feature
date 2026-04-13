# language: zh-CN
@p0 @cross-cutting @tenancy
功能: 多租户数据隔离
  作为一个租户管理员
  我希望只能看到自己租户的数据
  以便租户间数据完全隔离

  背景:
    Given 系统中存在两个租户:
      | 租户    | 代码      | 考试               |
      | 租户A  | tenant_a  | 教师资格考试       |
      | 租户B  | tenant_b  | 公务员笔试         |

  @smoke @p0
  场景: 租户A管理员看不到租户B的考试
    Given 我以 "租户A管理员" 身份登录
    When 我访问考试管理页面 "/tenant_a/admin/exams"
    Then 考试列表中应包含 "教师资格考试"
    And 考试列表中不应包含 "公务员笔试"

  @smoke @p0
  场景: 租户B考生看不到租户A的考试
    Given 我以 "租户B考生" 身份登录
    When 我访问考试列表页面 "/tenant_b/candidate/exams"
    Then 考试列表中应包含 "公务员笔试"
    And 考试列表中不应包含 "教师资格考试"

  @p0
  场景: 超级管理员可以切换租户上下文
    Given 我以超级管理员身份登录
    When 我切换到 "租户A" 上下文
    Then 我应能看到 "租户A" 的考试数据
    When 我切换到 "租户B" 上下文
    Then 我应能看到 "租户B" 的考试数据
    And 我不应再看到 "租户A" 的考试数据

  @p1
  场景: 跨租户报名——同一考生可报多个租户的考试
    Given 我作为考生 "candidate1" 已注册
    When 我报名 "租户A" 的 "教师资格考试"
    And 我报名 "租户B" 的 "公务员笔试"
    Then 我的报名列表应显示两条记录分属不同租户

  @p0
  场景: 审核员只能审核本租户的报名
    Given 我是 "租户A" 的一级审核员
    When 我拉取审核任务
    Then 审核队列中只包含 "租户A" 的报名