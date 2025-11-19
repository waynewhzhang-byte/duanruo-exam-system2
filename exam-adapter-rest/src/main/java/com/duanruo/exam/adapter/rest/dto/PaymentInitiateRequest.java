package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class PaymentInitiateRequest {
    @NotNull
    private UUID applicationId;
    private String channel; // optional, default to STUB if null/blank

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
}

