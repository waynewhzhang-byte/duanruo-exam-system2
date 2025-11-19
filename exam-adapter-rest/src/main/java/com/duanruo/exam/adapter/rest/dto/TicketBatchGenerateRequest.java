package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * 批量生成准考证请求DTO
 */
public class TicketBatchGenerateRequest {
    
    @NotNull
    @NotEmpty
    private List<UUID> applicationIds;
    
    private String customPrefix;
    private String customFormat;
    private Boolean forceRegenerate;
    
    public TicketBatchGenerateRequest() {}
    
    public TicketBatchGenerateRequest(List<UUID> applicationIds) {
        this.applicationIds = applicationIds;
    }
    
    public List<UUID> getApplicationIds() {
        return applicationIds;
    }
    
    public void setApplicationIds(List<UUID> applicationIds) {
        this.applicationIds = applicationIds;
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
