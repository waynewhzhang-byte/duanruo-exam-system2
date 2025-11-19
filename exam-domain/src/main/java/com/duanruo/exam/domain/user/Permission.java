package com.duanruo.exam.domain.user;

/**
 * 权限枚举
 * 根据PRD定义的功能权限
 */
public enum Permission {
    
    // 考试管理权限
    EXAM_CREATE("创建考试"),
    EXAM_UPDATE("更新考试"),
    EXAM_DELETE("删除考试"),
    EXAM_VIEW("查看考试"),
    EXAM_VIEW_PUBLIC("查看公开考试信息"),
    EXAM_OPEN("开放考试报名"),
    EXAM_CLOSE("关闭考试报名"),
    
    // 岗位管理权限
    POSITION_CREATE("创建岗位"),
    POSITION_UPDATE("更新岗位"),
    POSITION_DELETE("删除岗位"),
    POSITION_VIEW("查看岗位"),
    POSITION_FORM_CONFIG("配置岗位表单"),
    
    // 科目管理权限
    SUBJECT_CREATE("创建科目"),
    SUBJECT_UPDATE("更新科目"),
    SUBJECT_DELETE("删除科目"),
    SUBJECT_VIEW("查看科目"),
    
    // 申请管理权限
    APPLICATION_CREATE("创建申请"),
    APPLICATION_VIEW_OWN("查看自己的申请"),
    APPLICATION_VIEW_ASSIGNED("查看分配给自己的申请"),
    APPLICATION_VIEW_ALL("查看所有申请"),
    APPLICATION_VIEW_BASIC("查看申请基本信息"),
    APPLICATION_UPDATE_OWN("更新自己的申请"),
    APPLICATION_WITHDRAW("撤销申请"),
    APPLICATION_BULK_OPERATION("批量操作申请"),
    APPLICATION_PAY("支付报名费"),
    
    // 审核权限
    REVIEW_PRIMARY("一级审核"),
    REVIEW_SECONDARY("二级审核"),
    REVIEW_STATISTICS("查看审核统计"),
    REVIEW_BATCH("批量审核"),
    
    // 文件管理权限
    FILE_UPLOAD("上传文件"),
    FILE_VIEW_OWN("查看自己的文件"),
    FILE_VIEW("查看文件"),
    FILE_DELETE("删除文件"),
    FILE_SCAN("文件病毒扫描"),
    
    // 准考证权限
    TICKET_VIEW_OWN("查看自己的准考证"),
    TICKET_GENERATE("生成准考证"),
    TICKET_BATCH_GENERATE("批量生成准考证"),
    TICKET_VALIDATE("验证准考证"),
    TICKET_VERIFY("验证准考证（新）"),
    TICKET_DOWNLOAD("下载准考证"),
    TICKET_ISSUE("发放准考证"),
    TICKET_TEMPLATE_VIEW("查看准考证模板"),
    TICKET_TEMPLATE_UPDATE("更新准考证模板"),
    TICKET_TEMPLATE_DELETE("删除准考证模板"),

    // 支付权限
    PAYMENT_CREATE("创建支付"),
    PAYMENT_VIEW("查看支付信息"),
    PAYMENT_INITIATE("发起支付"),
    PAYMENT_CONFIG_VIEW("查看支付配置"),
    
    // 租户管理权限
    TENANT_CREATE("创建租户"),
    TENANT_UPDATE("更新租户"),
    TENANT_DELETE("删除租户"),
    TENANT_VIEW("查看租户"),
    TENANT_VIEW_ALL("查看所有租户"),
    TENANT_ACTIVATE("激活租户"),
    TENANT_DEACTIVATE("停用租户"),

    // 用户管理权限
    USER_MANAGE("用户管理"),  // 系统级用户管理
    USER_CREATE("创建用户"),  // SUPER_ADMIN创建用户
    USER_CREATE_TENANT("创建租户用户"),  // TENANT_ADMIN在租户内创建用户
    USER_UPDATE("更新用户"),
    USER_DELETE("删除用户"),
    USER_VIEW("查看用户"),
    TENANT_USER_MANAGE("租户用户管理"),  // 租户级用户管理
    USER_TENANT_ROLE_GRANT("授予用户租户角色"),  // 为用户添加租户角色

    // 角色和权限管理
    ROLE_MANAGE("角色管理"),
    PERMISSION_ASSIGN("权限分配"),

    // 系统配置权限
    SYSTEM_CONFIG("系统配置"),
    SYSTEM_MONITOR("系统监控"),
    
    // 考场管理权限
    VENUE_CREATE("创建考场"),
    VENUE_UPDATE("更新考场"),
    VENUE_DELETE("删除考场"),
    VENUE_VIEW("查看考场"),
    VENUE_LIST("列出考场"),

    // 座位管理权限
    SEAT_ALLOCATE("分配座位"),
    SEAT_VIEW("查看座位"),
    SEAT_UPDATE("更新座位"),
    SEATING_ALLOCATE("执行座位分配"),
    
    // 通知权限
    NOTIFICATION_SEND("发送通知"),
    NOTIFICATION_VIEW("查看通知"),
    NOTIFICATION_HISTORY_VIEW("查看通知历史"),

    // 通知模板管理
    TEMPLATE_CREATE("创建通知模板"),
    TEMPLATE_VIEW("查看通知模板"),
    TEMPLATE_UPDATE("更新通知模板"),
    TEMPLATE_DELETE("删除通知模板"),

    // 报表权限
    REPORT_VIEW("查看报表"),
    REPORT_EXPORT("导出报表"),

    // 统计分析权限
    STATISTICS_VIEW("查看统计"),
    STATISTICS_SYSTEM_VIEW("查看系统统计"),
    STATISTICS_TENANT_VIEW("查看租户统计"),

    // 审计权限
    AUDIT_VIEW("查看审计日志"),
    AUDIT_EXPORT("导出审计日志"),

    // PII合规权限
    PII_EXPORT("导出个人信息"),
    PII_ANONYMIZE("匿名化用户数据"),
    PII_DELETE("删除用户数据"),
    PII_AUDIT("审计PII访问"),
    PII_POLICY_VIEW("查看数据保留策略"),

    // 通知历史权限
    NOTIFICATION_HISTORY_LIST("列出通知历史"),
    NOTIFICATION_HISTORY_STATISTICS("通知历史统计"),
    NOTIFICATION_HISTORY_RESEND("重新发送通知"),

    // 申请草稿权限
    APPLICATION_DRAFT_SAVE("保存申请草稿"),
    APPLICATION_DRAFT_UPDATE("更新申请草稿"),
    APPLICATION_DRAFT_LIST("列出申请草稿"),

    // 成绩管理权限
    SCORE_RECORD("录入成绩"),
    SCORE_VIEW("查看成绩"),
    SCORE_VIEW_OWN("查看自己的成绩"),
    SCORE_UPDATE("更新成绩"),
    SCORE_DELETE("删除成绩"),
    SCORE_BATCH_IMPORT("批量导入成绩"),
    SCORE_STATISTICS("成绩统计"),

    // 考试管理员权限
    EXAM_ADMIN_MANAGE("管理考试管理员"),
    EXAM_FORM_CONFIG("配置报名表单"),
    EXAM_VENUE_MANAGE("管理考场"),
    EXAM_SCHEDULE_MANAGE("管理考试安排"),

    // 面试管理权限
    INTERVIEW_SCHEDULE("安排面试"),
    INTERVIEW_CONDUCT("进行面试"),
    INTERVIEW_RESULT("录入面试结果");

    private final String description;

    Permission(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 检查权限是否为考试相关权限
     */
    public boolean isExamRelated() {
        return name().startsWith("EXAM_") ||
               name().startsWith("POSITION_") ||
               name().startsWith("SUBJECT_") ||
               name().startsWith("SCORE_") ||
               name().startsWith("INTERVIEW_");
    }

    /**
     * 检查权限是否为审核相关权限
     */
    public boolean isReviewRelated() {
        return name().startsWith("REVIEW_") || 
               name().startsWith("APPLICATION_");
    }

    /**
     * 检查权限是否为文件相关权限
     */
    public boolean isFileRelated() {
        return name().startsWith("FILE_");
    }

    /**
     * 检查权限是否为准考证相关权限
     */
    public boolean isTicketRelated() {
        return name().startsWith("TICKET_");
    }

    /**
     * 检查权限是否为管理员专用权限
     */
    public boolean isAdminOnly() {
        return this == USER_MANAGE ||
               this == SYSTEM_CONFIG ||
               this == SYSTEM_MONITOR ||
               this == APPLICATION_BULK_OPERATION ||
               this == TICKET_BATCH_GENERATE ||
               this == FILE_SCAN ||
               this == EXAM_ADMIN_MANAGE ||
               this == SCORE_DELETE ||
               this == SCORE_BATCH_IMPORT;
    }

    /**
     * 检查权限是否为只读权限
     */
    public boolean isReadOnly() {
        return name().contains("VIEW") || 
               name().contains("STATISTICS") ||
               name().equals("AUDIT_VIEW");
    }

    @Override
    public String toString() {
        return name() + "(" + description + ")";
    }
}
