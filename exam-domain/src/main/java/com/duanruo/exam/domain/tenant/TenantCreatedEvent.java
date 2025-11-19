package com.duanruo.exam.domain.tenant;

import com.duanruo.exam.shared.domain.TenantId;

import java.time.LocalDateTime;

/**
 * 租户创建事件
 * 当新租户创建时发布此事件
 */
public class TenantCreatedEvent {
    
    private final TenantId tenantId;
    private final String tenantName;
    private final String tenantCode;
    private final String schemaName;
    private final LocalDateTime createdAt;
    
    public TenantCreatedEvent(
            TenantId tenantId,
            String tenantName,
            String tenantCode,
            String schemaName,
            LocalDateTime createdAt) {
        this.tenantId = tenantId;
        this.tenantName = tenantName;
        this.tenantCode = tenantCode;
        this.schemaName = schemaName;
        this.createdAt = createdAt;
    }
    
    public TenantId getTenantId() {
        return tenantId;
    }
    
    public String getTenantName() {
        return tenantName;
    }
    
    public String getTenantCode() {
        return tenantCode;
    }
    
    public String getSchemaName() {
        return schemaName;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    @Override
    public String toString() {
        return "TenantCreatedEvent{" +
                "tenantId=" + tenantId +
                ", tenantName='" + tenantName + '\'' +
                ", tenantCode='" + tenantCode + '\'' +
                ", schemaName='" + schemaName + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}

