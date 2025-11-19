package com.duanruo.exam.domain.payment;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.shared.AggregateRoot;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付订单聚合根
 */
public class PaymentOrder implements AggregateRoot {
    
    private PaymentOrderId id;
    private ApplicationId applicationId;
    private String outTradeNo; // 商户订单号
    private BigDecimal amount; // 支付金额
    private String currency; // 币种
    private PaymentChannel channel; // 支付渠道
    private PaymentStatus status; // 支付状态
    private String transactionId; // 第三方交易号
    private String paymentParams; // 支付参数（JSON格式）
    private String callbackData; // 回调数据（JSON格式）
    private String failureReason; // 失败原因
    private LocalDateTime paidAt; // 支付完成时间
    private LocalDateTime expiredAt; // 过期时间
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private PaymentOrder() {}

    /**
     * 创建支付订单
     */
    public static PaymentOrder create(
            ApplicationId applicationId,
            BigDecimal amount,
            String currency,
            PaymentChannel channel) {
        
        if (applicationId == null) {
            throw new IllegalArgumentException("applicationId不能为空");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("支付金额必须大于0");
        }
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("币种不能为空");
        }
        if (channel == null) {
            throw new IllegalArgumentException("支付渠道不能为空");
        }

        PaymentOrder order = new PaymentOrder();
        order.id = PaymentOrderId.generate();
        order.applicationId = applicationId;
        order.outTradeNo = generateOutTradeNo();
        order.amount = amount;
        order.currency = currency;
        order.channel = channel;
        order.status = PaymentStatus.PENDING;
        order.createdAt = LocalDateTime.now();
        order.updatedAt = LocalDateTime.now();
        // 默认30分钟过期
        order.expiredAt = LocalDateTime.now().plusMinutes(30);
        
        return order;
    }

    /**
     * 生成商户订单号
     * 格式: PAY + yyyyMMddHHmmss + 6位随机数
     */
    private static String generateOutTradeNo() {
        String timestamp = java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .format(LocalDateTime.now());
        String random = String.format("%06d", (int)(Math.random() * 1000000));
        return "PAY" + timestamp + random;
    }

    /**
     * 标记为处理中
     */
    public void markAsProcessing(String paymentParams) {
        if (status != PaymentStatus.PENDING) {
            throw new IllegalStateException("只有待支付状态才能标记为处理中");
        }
        this.status = PaymentStatus.PROCESSING;
        this.paymentParams = paymentParams;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记为支付成功
     */
    public void markAsSuccess(String transactionId, String callbackData) {
        if (status != PaymentStatus.PENDING && status != PaymentStatus.PROCESSING) {
            throw new IllegalStateException("当前状态不允许标记为成功");
        }
        this.status = PaymentStatus.SUCCESS;
        this.transactionId = transactionId;
        this.callbackData = callbackData;
        this.paidAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记为支付失败
     */
    public void markAsFailed(String failureReason) {
        if (status.isTerminal()) {
            throw new IllegalStateException("终态订单不能标记为失败");
        }
        this.status = PaymentStatus.FAILED;
        this.failureReason = failureReason;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 取消订单
     */
    public void cancel() {
        if (!status.canCancel()) {
            throw new IllegalStateException("当前状态不允许取消");
        }
        this.status = PaymentStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记为已退款
     */
    public void markAsRefunded() {
        if (!status.canRefund()) {
            throw new IllegalStateException("当前状态不允许退款");
        }
        this.status = PaymentStatus.REFUNDED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查是否已过期
     */
    public boolean isExpired() {
        return expiredAt != null && LocalDateTime.now().isAfter(expiredAt);
    }

    // Getters
    public PaymentOrderId getId() {
        return id;
    }

    public ApplicationId getApplicationId() {
        return applicationId;
    }

    public String getOutTradeNo() {
        return outTradeNo;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public PaymentChannel getChannel() {
        return channel;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getPaymentParams() {
        return paymentParams;
    }

    public String getCallbackData() {
        return callbackData;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Package-private setters for JPA
    void setId(PaymentOrderId id) {
        this.id = id;
    }

    void setApplicationId(ApplicationId applicationId) {
        this.applicationId = applicationId;
    }

    void setOutTradeNo(String outTradeNo) {
        this.outTradeNo = outTradeNo;
    }

    void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    void setCurrency(String currency) {
        this.currency = currency;
    }

    void setChannel(PaymentChannel channel) {
        this.channel = channel;
    }

    void setStatus(PaymentStatus status) {
        this.status = status;
    }

    void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    void setPaymentParams(String paymentParams) {
        this.paymentParams = paymentParams;
    }

    void setCallbackData(String callbackData) {
        this.callbackData = callbackData;
    }

    void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    void setExpiredAt(LocalDateTime expiredAt) {
        this.expiredAt = expiredAt;
    }

    void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

