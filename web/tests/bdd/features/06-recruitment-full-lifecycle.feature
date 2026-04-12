@e2e @recruitment
Feature: 招聘考试全流程全闭环验证
  作为系统核心用户，我希望从报名到领证的整个业务流程能够自动化流转且数据一致。

  Background:
    Given 系统已初始化基础数据（租户 "EduGroup", 考试 "2026公开招聘", 岗位 "技术专家"）
    And 考场 "第一实验中学" 已录入，包含 2 个教室，总容量 60 人

  @happy-path
  Scenario: 考生完成全流程报名并获取准考证
    # 1. 考生报名
    Given 我以考生 "Candidate_Zhang" 身份登录
    When 我填写 "技术专家" 岗位的报名表：
      | 字段     | 值           |
      | 姓名     | 张三         |
      | 年龄     | 28           |
      | 学历     | 硕士         |
    And 我上传附件 "id_card.png" 和 "resume.pdf"
    And 我点击提交报名
    Then 系统应提示 "报名提交成功，正在进行自动审核"

    # 2. 后端自动验证与人工审核
    Given 报名已触发自动验证规则（年龄 > 18 且 学历 >= 本科）
    Then 报名状态应自动变为 "PENDING_PRIMARY_REVIEW"
    When 一审员 "Reviewer_A" 登录并点击 "通过"
    And 二审员 "Reviewer_B" 登录并点击 "通过"
    Then 报名状态应更新为 "APPROVED"

    # 3. 缴费流程
    When 考生 "Candidate_Zhang" 访问缴费页面并确认支付
    Then 报名状态应更新为 "PAID"

    # 4. 考务安排与发证
    When 租户管理员登录并执行 "自动分配座位"
    And 执行 "批量生成准考证"
    Then 考试 "2026公开招聘" 的发证进度应为 100%

    # 5. 最终验证
    When 考生 "Candidate_Zhang" 再次登录门户
    Then 我应该能看到 "下载准考证" 按钮
    And 点击后显示的准考证应包含 "第一实验中学" 和确定的 "座位号"
