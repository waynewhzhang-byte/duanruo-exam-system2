package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class PaymentCallbackRequest {
    @NotNull
    private UUID appId;
    @NotNull
    private BigDecimal amount;
    private String channel; // optional, default handled upstream if needed
    private String transactionId; // optional; may be provided by gateway
    @NotNull
    private String nonce;
    @NotNull
    private Long timestamp;
    @NotNull
    private String sign;

    public UUID getAppId() { return appId; }
    public void setAppId(UUID appId) { this.appId = appId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getNonce() { return nonce; }
    public void setNonce(String nonce) { this.nonce = nonce; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public String getSign() { return sign; }
    public void setSign(String sign) { this.sign = sign; }
}

