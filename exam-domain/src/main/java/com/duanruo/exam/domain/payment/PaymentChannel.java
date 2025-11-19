package com.duanruo.exam.domain.payment;

/**
 * 支付渠道枚举
 */
public enum PaymentChannel {
    /**
     * 支付宝支付
     */
    ALIPAY("支付宝"),
    
    /**
     * 微信支付
     */
    WECHAT("微信支付"),
    
    /**
     * 模拟支付（仅用于测试）
     */
    MOCK("模拟支付");

    private final String displayName;

    PaymentChannel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

