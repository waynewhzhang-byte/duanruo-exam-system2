package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * 批量状态转换请求DTO
 */
public class ApplicationBatchTransitionRequest {
    
    @NotNull
    @NotEmpty
    private List<UUID> applicationIds;
    
    @NotBlank
    private String targetStatus;
    
    private Boolean dryRun = false;
    
    private String reason;
    
    public ApplicationBatchTransitionRequest() {}
    
    public ApplicationBatchTransitionRequest(List<UUID> applicationIds, String targetStatus) {
        this.applicationIds = applicationIds;
        this.targetStatus = targetStatus;
    }
    
    public List<UUID> getApplicationIds() {
        return applicationIds;
    }
    
    public void setApplicationIds(List<UUID> applicationIds) {
        this.applicationIds = applicationIds;
    }
    
    public String getTargetStatus() {
        return targetStatus;
    }
    
    public void setTargetStatus(String targetStatus) {
        this.targetStatus = targetStatus;
    }
    
    public Boolean getDryRun() {
        return dryRun;
    }
    
    public void setDryRun(Boolean dryRun) {
        this.dryRun = dryRun;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
}
