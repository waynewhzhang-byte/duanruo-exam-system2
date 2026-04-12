# language: zh-CN
功能: 考生上传报名材料
  作为一个考生
  我想上传所需的证明材料
  以便我的申请可以被审核

  前提条件:
    Given 我在报名表单页面

  @critical @p0 @candidate
  场景: 考生上传单个文件
    And 上传字段 "身份证" 支持的文件类型为 "jpg,png,pdf"
    And 最大文件大小为 "5MB"
    When 我选择文件 "id_card.jpg" 大小 "2MB"
    And 我点击上传按钮
    Then 我应该看到上传成功提示
    And 文件应显示在已上传文件列表中

  @p1 @candidate
  场景: 考生上传过大文件被拒绝
    When 我选择文件 "large_file.jpg" 大小 "10MB"
    Then 我应该看到错误提示 "文件大小超过5MB限制"
    And 文件不应被上传

  @p1 @candidate
  场景: 考生上传不支持的文件类型
    When 我选择文件 "malicious.exe"
    Then 我应该看到错误提示 "不支持的文件类型"
    And 文件不应被上传

  @p2 @candidate
  场景: 考生删除已上传的文件
    Given 我已上传文件 "id_card.jpg"
    When 我点击删除按钮
    And 我确认删除
    Then 文件应从列表中移除
