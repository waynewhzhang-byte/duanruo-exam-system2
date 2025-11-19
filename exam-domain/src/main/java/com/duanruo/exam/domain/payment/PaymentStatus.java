package com.duanruo.exam.domain.payment;

/**
 * 支付状态枚举
 */
public enum PaymentStatus {
    /**
     * 待支付
     */
    PENDING("待支付"),
    
    /**
     * 支付处理中
     */
    PROCESSING("处理中"),
    
    /**
     * 支付成功
     */
    SUCCESS("支付成功"),
    
    /**
     * 支付失败
     */
    FAILED("支付失败"),
    
    /**
     * 已取消
     */
    CANCELLED("已取消"),
    
    /**
     * 已退款
     */
    REFUNDED("已退款");

    private final String displayName;

    PaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * 是否为终态
     */
    public boolean isTerminal() {
        return this == SUCCESS || this == FAILED || this == CANCELLED || this == REFUNDED;
    }

    /**
     * 是否可以取消
     */
    public boolean canCancel() {
        return this == PENDING || this == PROCESSING;
    }

    /**
     * 是否可以退款
     */
    public boolean canRefund() {
        return this == SUCCESS;
    }
}

