package com.duanruo.exam.domain.pii;

import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.shared.domain.AggregateRoot;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PII数据访问审计日志聚合根
 * 记录敏感数据的访问情况，用于合规审计
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
public class PIIAccessLog extends AggregateRoot<PIIAccessLogId> {
    
    /**
     * 访问者用户ID
     */
    private final UserId userId;
    
    /**
     * 访问者用户名
     */
    private final String username;
    
    /**
     * 访问者角色
     */
    private final String userRole;
    
    /**
     * 访问的资源类型（如：Application, User, Candidate等）
     */
    private final String resourceType;
    
    /**
     * 访问的资源ID
     */
    private final String resourceId;
    
    /**
     * 访问的PII字段名称
     */
    private final String fieldName;
    
    /**
     * PII字段类型
     */
    private final String fieldType;
    
    /**
     * 访问操作类型（READ, EXPORT, DOWNLOAD等）
     */
    private final PIIAccessType accessType;
    
    /**
     * 访问时间
     */
    private final LocalDateTime accessedAt;
    
    /**
     * 访问来源IP
     */
    private final String ipAddress;
    
    /**
     * 访问来源（如：WEB, API, MOBILE等）
     */
    private final String source;
    
    /**
     * 是否脱敏访问
     */
    private final boolean masked;
    
    /**
     * 访问原因/目的（可选）
     */
    private final String purpose;
    
    /**
     * 私有构造函数，通过工厂方法创建
     */
    private PIIAccessLog(
            PIIAccessLogId id,
            UserId userId,
            String username,
            String userRole,
            String resourceType,
            String resourceId,
            String fieldName,
            String fieldType,
            PIIAccessType accessType,
            LocalDateTime accessedAt,
            String ipAddress,
            String source,
            boolean masked,
            String purpose) {
        super(id);
        this.userId = userId;
        this.username = username;
        this.userRole = userRole;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.fieldName = fieldName;
        this.fieldType = fieldType;
        this.accessType = accessType;
        this.accessedAt = accessedAt;
        this.ipAddress = ipAddress;
        this.source = source;
        this.masked = masked;
        this.purpose = purpose;
    }
    
    /**
     * 创建PII访问日志
     */
    public static PIIAccessLog create(
            UserId userId,
            String username,
            String userRole,
            String resourceType,
            String resourceId,
            String fieldName,
            String fieldType,
            PIIAccessType accessType,
            String ipAddress,
            String source,
            boolean masked,
            String purpose) {
        
        return new PIIAccessLog(
                PIIAccessLogId.of(UUID.randomUUID()),
                userId,
                username,
                userRole,
                resourceType,
                resourceId,
                fieldName,
                fieldType,
                accessType,
                LocalDateTime.now(),
                ipAddress,
                source,
                masked,
                purpose
        );
    }
    
    // Getters
    
    public UserId getUserId() {
        return userId;
    }
    
    public String getUsername() {
        return username;
    }
    
    public String getUserRole() {
        return userRole;
    }
    
    public String getResourceType() {
        return resourceType;
    }
    
    public String getResourceId() {
        return resourceId;
    }
    
    public String getFieldName() {
        return fieldName;
    }
    
    public String getFieldType() {
        return fieldType;
    }
    
    public PIIAccessType getAccessType() {
        return accessType;
    }
    
    public LocalDateTime getAccessedAt() {
        return accessedAt;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public String getSource() {
        return source;
    }
    
    public boolean isMasked() {
        return masked;
    }
    
    public String getPurpose() {
        return purpose;
    }
}

