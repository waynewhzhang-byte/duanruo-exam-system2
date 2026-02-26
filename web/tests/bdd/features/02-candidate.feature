@p0 @layer-1
Feature: 考生报名

  考生浏览考试、提交报名申请、上传资料、查看报名状态

  @view-exam-list
  Scenario: 浏览考试列表
    Given 考生已登录
    And 租户 "demo" 有开放的考试
    When 访问考试列表页 "/demo/exams"
    Then 显示所有开放报名的考试
    And 每条考试显示：标题、岗位数、报名时间

  @view-exam-detail
  Scenario: 查看考试详情
    Given 考试列表页
    When 点击某考试
    Then 显示考试详情含岗位信息
    And 显示报名开始/结束时间

  @submit-application
  Scenario: 提交报名申请
    Given 考生进入考试详情页
    And 选择报考岗位
    And 填写报名表单
    When 点击提交报名
    Then 报名状态变为"已提交"
    And 显示报名成功提示

  @upload-files
  Scenario: 上传报名资料
    Given 报名表单页面
    When 选择本地证件照片文件
    And 点击上传
    Then 文件上传成功
    And 显示文件缩略图

  @view-my-applications
  Scenario: 查看我的报名
    Given 考生有报名记录
    When 访问 "/demo/candidate/applications"
    Then 显示所有报名及状态
    And 显示报名时间、岗位、状态

  @view-ticket
  Scenario: 查看准考证
    Given 报名已审核通过
    And 准考证已生成
    When 查看准考证
    Then 显示考生信息、考试信息、座位信息
    And 显示二维码
