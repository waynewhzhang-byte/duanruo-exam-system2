package com.duanruo.exam.application.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * 批量审核请求
 */
public class BatchReviewRequest {
    
    @NotEmpty(message = "报名ID列表不能为空")
    private List<UUID> applicationIds;
    
    @NotNull(message = "审核决策不能为空")
    private Boolean approve;
    
    private String reason;
    
    private List<UUID> evidenceFileIds;

    public BatchReviewRequest() {
    }

    public BatchReviewRequest(List<UUID> applicationIds, Boolean approve, String reason, List<UUID> evidenceFileIds) {
        this.applicationIds = applicationIds;
        this.approve = approve;
        this.reason = reason;
        this.evidenceFileIds = evidenceFileIds;
    }

    public List<UUID> getApplicationIds() {
        return applicationIds;
    }

    public void setApplicationIds(List<UUID> applicationIds) {
        this.applicationIds = applicationIds;
    }

    public Boolean getApprove() {
        return approve;
    }

    public void setApprove(Boolean approve) {
        this.approve = approve;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public List<UUID> getEvidenceFileIds() {
        return evidenceFileIds;
    }

    public void setEvidenceFileIds(List<UUID> evidenceFileIds) {
        this.evidenceFileIds = evidenceFileIds;
    }
}

