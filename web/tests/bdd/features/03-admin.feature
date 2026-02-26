@p0 @layer-2
Feature: 考试管理

  租户管理员创建考试、管理岗位、查看报名数据

  @create-exam
  Scenario: 创建考试
    Given 租户管理员已登录
    When 访问考试管理页
    And 点击"创建考试"
    And 填写考试信息：标题、代码、描述
    And 选择报名时间
    And 点击保存
    Then 考试创建成功
    And 状态为"草稿"

  @publish-exam
  Scenario: 发布考试
    Given 考试为草稿状态
    When 点击"发布"
    Then 考试状态变为"开放报名"
    And 考生可在门户看到考试

  @add-position
  Scenario: 添加岗位
    Given 考试详情页
    When 点击"添加岗位"
    And 填写岗位信息：岗位名称、代码、招聘人数
    Then 岗位添加成功

  @export-applications
  Scenario: 导出报名数据
    Given 有报名数据
    When 点击"导出"
    Then 下载Excel文件
    And 包含报名人信息、岗位、状态

  @view-statistics
  Scenario: 查看报名统计
    Given 租户管理员
    When 查看报名统计
    Then 显示：总报名人数、各岗位报名数、支付状态分布
