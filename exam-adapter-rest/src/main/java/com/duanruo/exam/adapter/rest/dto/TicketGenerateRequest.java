package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * 准考证生成请求DTO
 */
public class TicketGenerateRequest {
    
    @NotNull
    private UUID applicationId;
    
    private String customPrefix;
    private String customFormat;
    private Boolean forceRegenerate;
    
    public TicketGenerateRequest() {}
    
    public TicketGenerateRequest(UUID applicationId) {
        this.applicationId = applicationId;
    }
    
    public UUID getApplicationId() {
        return applicationId;
    }
    
    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }
    
    public String getCustomPrefix() {
        return customPrefix;
    }
    
    public void setCustomPrefix(String customPrefix) {
        this.customPrefix = customPrefix;
    }
    
    public String getCustomFormat() {
        return customFormat;
    }
    
    public void setCustomFormat(String customFormat) {
        this.customFormat = customFormat;
    }
    
    public Boolean getForceRegenerate() {
        return forceRegenerate;
    }
    
    public void setForceRegenerate(Boolean forceRegenerate) {
        this.forceRegenerate = forceRegenerate;
    }
}
