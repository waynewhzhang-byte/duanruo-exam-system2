# language: zh-CN
@p1 @admin @venue
功能: 考场与教室管理
  作为租户管理员
  我希望管理考场和教室
  以便为考试分配座位提供基础

  背景:
    Given 我以租户管理员身份登录
    And 考试 "2026年教师资格考试" 已存在
    And Chrome DevTools 浏览器已连接

  @p1
  场景: 创建考场
    When 我访问考场管理页面 "/[tenantSlug]/admin/seat-arrangement"
    And 我点击 "创建考场" 按钮
    And 我填写考场信息:
      | 字段     | 值           |
      | name     | 第一实验中学  |
      | address  | 北京市海淀区  |
      | capacity | 500          |
    And 我点击保存
    Then 考场 "第一实验中学" 应出现在列表中

  @p1
  场景: 为考场添加教室
    Given 考场 "第一实验中学" 已存在
    When 我进入考场详情
    And 我点击 "添加教室" 按钮
    And 我填写教室信息:
      | 字段     | 值       |
      | name     | A101     |
      | code     | RM-A101  |
      | capacity | 30       |
      | floor    | 1        |
    And 我点击保存
    Then 教室 "A101" 应出现在考场下
    And 考场总容量应更新为 30

  @p1
  场景: 编辑教室信息
    Given 教室 "A101" 容量为 30
    When 我编辑教室容量为 35
    And 我保存更改
    Then 容量应更新为 35

  @p2
  场景: 删除无座位的教室
    Given 教室 "A101" 尚未分配座位
    When 我删除教室 "A101"
    And 我确认删除
    Then 教室 "A101" 应从列表中移除
    And 考场总容量应相应减少

  @p2
  场景: 无法删除已有座位的教室
    Given 教室 "A101" 已分配座位
    When 我尝试删除教室 "A101"
    Then 系统应提示 "该教室已有座位分配，无法删除"