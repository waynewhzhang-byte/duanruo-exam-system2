# language: zh-CN
功能: 初审操作
  作为一个一级审核员
  我想审核申请
  以便我可以批准或拒绝它们

  @critical @p0 @reviewer
  场景: 初审员审核通过申请
    Given 我在申请详情页
    And 我查看了考生信息和材料
    When 我点击审核通过按钮
    And 我填写审核意见 "材料齐全，符合要求"
    And 我确认提交
    Then 我应该看到审核成功提示
    And 申请状态应变为 "初审通过"
    And 申请应进入复审队列

  @critical @p0 @reviewer
  场景: 初审员审核拒绝申请
    Given 我在申请详情页
    When 我点击审核拒绝按钮
    And 我填写拒绝原因 "学历不符合要求"
    And 我确认提交
    Then 我应该看到拒绝成功提示
    And 申请状态应变为 "初审拒绝"

  @p1 @reviewer
  场景: 初审员要求补充材料
    Given 我在申请详情页
    When 我发现材料不完整
    And 我点击要求补材料按钮
    And 我填写需要补充的内容
    And 我确认提交
    Then 考生应收到补材料通知
    And 申请状态应变为 "待补充材料"
