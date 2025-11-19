package com.duanruo.exam.infrastructure.persistence.entity;

import com.duanruo.exam.domain.audit.AuditAction;
import com.duanruo.exam.domain.audit.AuditResult;
import com.duanruo.exam.domain.user.Permission;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 审计日志实体
 * 
 * @author Augment Agent
 * @since 2025-10-25
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_logs_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_audit_logs_user_id", columnList = "user_id"),
        @Index(name = "idx_audit_logs_action", columnList = "action"),
        @Index(name = "idx_audit_logs_result", columnList = "result"),
        @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp"),
        @Index(name = "idx_audit_logs_resource", columnList = "resource_type, resource_id"),
        @Index(name = "idx_audit_logs_tenant_time", columnList = "tenant_id, timestamp"),
        @Index(name = "idx_audit_logs_user_time", columnList = "user_id, timestamp")
})
public class AuditLogEntity {
    
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(name = "username", length = 100)
    private String username;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 50)
    private AuditAction action;
    
    @Column(name = "resource_type", length = 100)
    private String resourceType;
    
    @Column(name = "resource_id", length = 100)
    private String resourceId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "required_permission", length = 50)
    private Permission requiredPermission;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 50)
    private AuditResult result;
    
    @Column(name = "ip_address", length = 50)
    private String ipAddress;
    
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    @Column(name = "request_method", length = 10)
    private String requestMethod;
    
    @Column(name = "request_path", length = 500)
    private String requestPath;
    
    @Column(name = "request_params", columnDefinition = "TEXT")
    private String requestParams;
    
    @Column(name = "response_status", length = 10)
    private String responseStatus;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "execution_time_ms")
    private Long executionTimeMs;
    
    // Constructors
    
    public AuditLogEntity() {
    }
    
    public AuditLogEntity(
            UUID id,
            UUID tenantId,
            UUID userId,
            String username,
            AuditAction action,
            String resourceType,
            String resourceId,
            Permission requiredPermission,
            AuditResult result,
            String ipAddress,
            String userAgent,
            String requestMethod,
            String requestPath,
            String requestParams,
            String responseStatus,
            String errorMessage,
            LocalDateTime timestamp,
            Long executionTimeMs) {
        this.id = id;
        this.tenantId = tenantId;
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.requiredPermission = requiredPermission;
        this.result = result;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.requestMethod = requestMethod;
        this.requestPath = requestPath;
        this.requestParams = requestParams;
        this.responseStatus = responseStatus;
        this.errorMessage = errorMessage;
        this.timestamp = timestamp;
        this.executionTimeMs = executionTimeMs;
    }
    
    // Getters and Setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
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
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public AuditAction getAction() {
        return action;
    }
    
    public void setAction(AuditAction action) {
        this.action = action;
    }
    
    public String getResourceType() {
        return resourceType;
    }
    
    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }
    
    public String getResourceId() {
        return resourceId;
    }
    
    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }
    
    public Permission getRequiredPermission() {
        return requiredPermission;
    }
    
    public void setRequiredPermission(Permission requiredPermission) {
        this.requiredPermission = requiredPermission;
    }
    
    public AuditResult getResult() {
        return result;
    }
    
    public void setResult(AuditResult result) {
        this.result = result;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public String getRequestMethod() {
        return requestMethod;
    }
    
    public void setRequestMethod(String requestMethod) {
        this.requestMethod = requestMethod;
    }
    
    public String getRequestPath() {
        return requestPath;
    }
    
    public void setRequestPath(String requestPath) {
        this.requestPath = requestPath;
    }
    
    public String getRequestParams() {
        return requestParams;
    }
    
    public void setRequestParams(String requestParams) {
        this.requestParams = requestParams;
    }
    
    public String getResponseStatus() {
        return responseStatus;
    }
    
    public void setResponseStatus(String responseStatus) {
        this.responseStatus = responseStatus;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public Long getExecutionTimeMs() {
        return executionTimeMs;
    }
    
    public void setExecutionTimeMs(Long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }
}

