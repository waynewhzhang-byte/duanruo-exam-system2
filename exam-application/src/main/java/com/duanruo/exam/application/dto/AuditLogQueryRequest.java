package com.duanruo.exam.application.dto;

import com.duanruo.exam.domain.audit.AuditAction;
import com.duanruo.exam.domain.audit.AuditResult;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 审计日志查询请求
 */
public class AuditLogQueryRequest {
    private UUID tenantId;
    private UUID userId;
    private AuditAction action;
    private AuditResult result;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int page = 0;
    private int size = 20;
    
    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
    
    public AuditAction getAction() {
        return action;
    }
    
    public void setAction(AuditAction action) {
        this.action = action;
    }
    
    public AuditResult getResult() {
        return result;
    }
    
    public void setResult(AuditResult result) {
        this.result = result;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    public int getPage() {
        return page;
    }
    
    public void setPage(int page) {
        this.page = page;
    }
    
    public int getSize() {
        return size;
    }
    
    public void setSize(int size) {
        this.size = size;
    }
}

