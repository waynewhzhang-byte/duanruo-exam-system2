package com.duanruo.exam.domain.audit;

/**
 * 审计操作类型
 */
public enum AuditAction {
    // 认证相关
    LOGIN("登录"),
    LOGOUT("登出"),
    LOGIN_FAILED("登录失败"),
    PASSWORD_CHANGE("修改密码"),
    PASSWORD_RESET("重置密码"),
    
    // 考试管理
    EXAM_CREATE("创建考试"),
    EXAM_UPDATE("更新考试"),
    EXAM_DELETE("删除考试"),
    EXAM_PUBLISH("发布考试"),
    EXAM_CANCEL("取消考试"),
    EXAM_COPY("复制考试"),
    EXAM_VIEW("查看考试"),
    
    // 岗位管理
    POSITION_CREATE("创建岗位"),
    POSITION_UPDATE("更新岗位"),
    POSITION_DELETE("删除岗位"),
    POSITION_VIEW("查看岗位"),
    POSITION_FORM_CONFIG("配置岗位表单"),
    
    // 科目管理
    SUBJECT_CREATE("创建科目"),
    SUBJECT_UPDATE("更新科目"),
    SUBJECT_DELETE("删除科目"),
    
    // 报名管理
    APPLICATION_SUBMIT("提交报名"),
    APPLICATION_UPDATE("更新报名"),
    APPLICATION_WITHDRAW("撤回报名"),
    APPLICATION_VIEW("查看报名"),
    APPLICATION_VIEW_OWN("查看自己的报名"),
    APPLICATION_EXPORT("导出报名数据"),
    APPLICATION_IMPORT("导入报名数据"),
    
    // 审核管理
    REVIEW_PRIMARY("一级审核"),
    REVIEW_SECONDARY("二级审核"),
    REVIEW_BATCH("批量审核"),
    REVIEW_ASSIGN("分配审核员"),
    REVIEW_CLAIM("认领审核任务"),
    REVIEW_RELEASE("释放审核任务"),
    
    // 支付管理
    PAYMENT_INITIATE("发起支付"),
    PAYMENT_CALLBACK("支付回调"),
    PAYMENT_REFUND("退款"),
    PAYMENT_CONFIG_VIEW("查看支付配置"),
    
    // 准考证管理
    TICKET_GENERATE("生成准考证"),
    TICKET_ISSUE("发放准考证"),
    TICKET_DOWNLOAD("下载准考证"),
    TICKET_VERIFY("验证准考证"),
    TICKET_TEMPLATE_VIEW("查看准考证模板"),
    TICKET_TEMPLATE_UPDATE("更新准考证模板"),
    TICKET_TEMPLATE_DELETE("删除准考证模板"),
    
    // 座位分配
    SEATING_ALLOCATE("分配座位"),
    SEATING_VIEW("查看座位"),
    
    // 考场管理
    VENUE_CREATE("创建考场"),
    VENUE_UPDATE("更新考场"),
    VENUE_DELETE("删除考试"),
    VENUE_LIST("列出考场"),
    
    // 成绩管理
    SCORE_CREATE("录入成绩"),
    SCORE_UPDATE("更新成绩"),
    SCORE_DELETE("删除成绩"),
    SCORE_VIEW("查看成绩"),
    SCORE_VIEW_OWN("查看自己的成绩"),
    SCORE_PUBLISH("发布成绩"),
    SCORE_EXPORT("导出成绩"),
    
    // 文件管理
    FILE_UPLOAD("上传文件"),
    FILE_DOWNLOAD("下载文件"),
    FILE_DELETE("删除文件"),
    FILE_VIEW("查看文件"),
    
    // 用户管理
    USER_CREATE("创建用户"),
    USER_UPDATE("更新用户"),
    USER_DELETE("删除用户"),
    USER_VIEW("查看用户"),
    USER_ROLE_ASSIGN("分配角色"),
    
    // 租户管理
    TENANT_CREATE("创建租户"),
    TENANT_UPDATE("更新租户"),
    TENANT_DELETE("删除租户"),
    TENANT_VIEW("查看租户"),
    TENANT_BACKUP("备份租户"),
    TENANT_RESTORE("恢复租户"),
    
    // 角色权限管理
    ROLE_MANAGE("管理角色"),
    PERMISSION_ASSIGN("分配权限"),
    
    // 通知管理
    TEMPLATE_CREATE("创建通知模板"),
    TEMPLATE_UPDATE("更新通知模板"),
    TEMPLATE_DELETE("删除通知模板"),
    TEMPLATE_VIEW("查看通知模板"),
    NOTIFICATION_SEND("发送通知"),
    NOTIFICATION_HISTORY_VIEW("查看通知历史"),
    
    // 统计分析
    STATISTICS_VIEW("查看统计"),
    
    // PII数据访问
    PII_ACCESS("访问敏感数据"),
    PII_EXPORT("导出敏感数据"),
    
    // 系统操作
    SYSTEM_CONFIG("系统配置"),
    SYSTEM_BACKUP("系统备份"),
    SYSTEM_RESTORE("系统恢复");
    
    private final String description;
    
    AuditAction(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}

