package com.duanruo.exam.domain.audit;

import com.duanruo.exam.domain.shared.AggregateRoot;
import com.duanruo.exam.domain.user.Permission;
import com.duanruo.exam.domain.user.UserId;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 审计日志聚合根
 * 记录所有需要审计的操作
 */
public class AuditLog implements AggregateRoot<UUID> {
    
    private final UUID id;
    private final UUID tenantId;
    private final UserId userId;
    private final String username;
    private final AuditAction action;
    private final String resourceType;
    private final String resourceId;
    private final Permission requiredPermission;
    private final AuditResult result;
    private final String ipAddress;
    private final String userAgent;
    private final String requestMethod;
    private final String requestPath;
    private final String requestParams;
    private final String responseStatus;
    private final String errorMessage;
    private final LocalDateTime timestamp;
    private final Long executionTimeMs;
    
    private AuditLog(Builder builder) {
        this.id = builder.id;
        this.tenantId = builder.tenantId;
        this.userId = builder.userId;
        this.username = builder.username;
        this.action = builder.action;
        this.resourceType = builder.resourceType;
        this.resourceId = builder.resourceId;
        this.requiredPermission = builder.requiredPermission;
        this.result = builder.result;
        this.ipAddress = builder.ipAddress;
        this.userAgent = builder.userAgent;
        this.requestMethod = builder.requestMethod;
        this.requestPath = builder.requestPath;
        this.requestParams = builder.requestParams;
        this.responseStatus = builder.responseStatus;
        this.errorMessage = builder.errorMessage;
        this.timestamp = builder.timestamp != null ? builder.timestamp : LocalDateTime.now();
        this.executionTimeMs = builder.executionTimeMs;
    }
    
    @Override
    public UUID getId() {
        return id;
    }
    
    public UUID getTenantId() {
        return tenantId;
    }
    
    public UserId getUserId() {
        return userId;
    }
    
    public String getUsername() {
        return username;
    }
    
    public AuditAction getAction() {
        return action;
    }
    
    public String getResourceType() {
        return resourceType;
    }
    
    public String getResourceId() {
        return resourceId;
    }
    
    public Permission getRequiredPermission() {
        return requiredPermission;
    }
    
    public AuditResult getResult() {
        return result;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public String getRequestMethod() {
        return requestMethod;
    }
    
    public String getRequestPath() {
        return requestPath;
    }
    
    public String getRequestParams() {
        return requestParams;
    }
    
    public String getResponseStatus() {
        return responseStatus;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public Long getExecutionTimeMs() {
        return executionTimeMs;
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private UUID id = UUID.randomUUID();
        private UUID tenantId;
        private UserId userId;
        private String username;
        private AuditAction action;
        private String resourceType;
        private String resourceId;
        private Permission requiredPermission;
        private AuditResult result;
        private String ipAddress;
        private String userAgent;
        private String requestMethod;
        private String requestPath;
        private String requestParams;
        private String responseStatus;
        private String errorMessage;
        private LocalDateTime timestamp;
        private Long executionTimeMs;
        
        public Builder id(UUID id) {
            this.id = id;
            return this;
        }
        
        public Builder tenantId(UUID tenantId) {
            this.tenantId = tenantId;
            return this;
        }
        
        public Builder userId(UserId userId) {
            this.userId = userId;
            return this;
        }
        
        public Builder username(String username) {
            this.username = username;
            return this;
        }
        
        public Builder action(AuditAction action) {
            this.action = action;
            return this;
        }
        
        public Builder resourceType(String resourceType) {
            this.resourceType = resourceType;
            return this;
        }
        
        public Builder resourceId(String resourceId) {
            this.resourceId = resourceId;
            return this;
        }
        
        public Builder requiredPermission(Permission requiredPermission) {
            this.requiredPermission = requiredPermission;
            return this;
        }
        
        public Builder result(AuditResult result) {
            this.result = result;
            return this;
        }
        
        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }
        
        public Builder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }
        
        public Builder requestMethod(String requestMethod) {
            this.requestMethod = requestMethod;
            return this;
        }
        
        public Builder requestPath(String requestPath) {
            this.requestPath = requestPath;
            return this;
        }
        
        public Builder requestParams(String requestParams) {
            this.requestParams = requestParams;
            return this;
        }
        
        public Builder responseStatus(String responseStatus) {
            this.responseStatus = responseStatus;
            return this;
        }
        
        public Builder errorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
            return this;
        }
        
        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }
        
        public Builder executionTimeMs(Long executionTimeMs) {
            this.executionTimeMs = executionTimeMs;
            return this;
        }
        
        public AuditLog build() {
            return new AuditLog(this);
        }
    }
}

