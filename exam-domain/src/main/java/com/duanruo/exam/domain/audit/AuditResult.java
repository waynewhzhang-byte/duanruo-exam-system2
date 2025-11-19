package com.duanruo.exam.domain.audit;

/**
 * 审计结果
 */
public enum AuditResult {
    SUCCESS("成功"),
    FAILURE("失败"),
    PERMISSION_DENIED("权限拒绝"),
    AUTHENTICATION_FAILED("认证失败"),
    VALIDATION_ERROR("验证错误"),
    RESOURCE_NOT_FOUND("资源不存在"),
    BUSINESS_ERROR("业务错误"),
    SYSTEM_ERROR("系统错误");
    
    private final String description;
    
    AuditResult(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}

