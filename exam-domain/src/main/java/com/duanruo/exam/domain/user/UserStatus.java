package com.duanruo.exam.domain.user;

/**
 * 用户状态枚举
 */
public enum UserStatus {
    
    /**
     * 活跃状态 - 可以正常登录和使用系统
     */
    ACTIVE("活跃"),
    
    /**
     * 非活跃状态 - 暂时停用，不能登录
     */
    INACTIVE("非活跃"),
    
    /**
     * 锁定状态 - 由于安全原因被锁定
     */
    LOCKED("锁定"),
    
    /**
     * 待验证状态 - 新注册用户，等待邮箱或手机验证
     */
    PENDING_VERIFICATION("待验证"),
    
    /**
     * 已删除状态 - 软删除，保留数据但不能使用
     */
    DELETED("已删除");

    private final String description;

    UserStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 检查用户是否可以登录
     */
    public boolean canLogin() {
        return this == ACTIVE;
    }

    /**
     * 检查用户是否可以执行操作
     */
    public boolean canPerformActions() {
        return this == ACTIVE;
    }

    /**
     * 检查用户是否需要验证
     */
    public boolean needsVerification() {
        return this == PENDING_VERIFICATION;
    }

    /**
     * 检查用户是否被锁定
     */
    public boolean isLocked() {
        return this == LOCKED;
    }

    /**
     * 检查用户是否被删除
     */
    public boolean isDeleted() {
        return this == DELETED;
    }

    @Override
    public String toString() {
        return name() + "(" + description + ")";
    }
}
