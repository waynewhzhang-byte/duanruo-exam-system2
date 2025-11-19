package com.duanruo.exam.infrastructure.persistence.entity;

import com.duanruo.exam.domain.pii.PIIAccessType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PII访问日志实体
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
@Entity
@Table(name = "pii_access_logs", indexes = {
        @Index(name = "idx_pii_access_logs_user_id", columnList = "user_id"),
        @Index(name = "idx_pii_access_logs_resource", columnList = "resource_type, resource_id"),
        @Index(name = "idx_pii_access_logs_accessed_at", columnList = "accessed_at"),
        @Index(name = "idx_pii_access_logs_access_type", columnList = "access_type"),
        @Index(name = "idx_pii_access_logs_user_time", columnList = "user_id, accessed_at")
})
public class PIIAccessLogEntity {
    
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "username", nullable = false, length = 100)
    private String username;
    
    @Column(name = "user_role", nullable = false, length = 50)
    private String userRole;
    
    @Column(name = "resource_type", nullable = false, length = 100)
    private String resourceType;
    
    @Column(name = "resource_id", nullable = false, length = 100)
    private String resourceId;
    
    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;
    
    @Column(name = "field_type", nullable = false, length = 50)
    private String fieldType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false, length = 20)
    private PIIAccessType accessType;
    
    @CreationTimestamp
    @Column(name = "accessed_at", nullable = false, updatable = false)
    private LocalDateTime accessedAt;
    
    @Column(name = "ip_address", length = 50)
    private String ipAddress;
    
    @Column(name = "source", length = 50)
    private String source;
    
    @Column(name = "masked", nullable = false)
    private boolean masked;
    
    @Column(name = "purpose", length = 500)
    private String purpose;
    
    // Constructors
    
    public PIIAccessLogEntity() {
    }
    
    public PIIAccessLogEntity(
            UUID id,
            UUID userId,
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
        this.id = id;
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
    
    // Getters and Setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
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
    
    public String getUserRole() {
        return userRole;
    }
    
    public void setUserRole(String userRole) {
        this.userRole = userRole;
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
    
    public String getFieldName() {
        return fieldName;
    }
    
    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }
    
    public String getFieldType() {
        return fieldType;
    }
    
    public void setFieldType(String fieldType) {
        this.fieldType = fieldType;
    }
    
    public PIIAccessType getAccessType() {
        return accessType;
    }
    
    public void setAccessType(PIIAccessType accessType) {
        this.accessType = accessType;
    }
    
    public LocalDateTime getAccessedAt() {
        return accessedAt;
    }
    
    public void setAccessedAt(LocalDateTime accessedAt) {
        this.accessedAt = accessedAt;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
    
    public String getSource() {
        return source;
    }
    
    public void setSource(String source) {
        this.source = source;
    }
    
    public boolean isMasked() {
        return masked;
    }
    
    public void setMasked(boolean masked) {
        this.masked = masked;
    }
    
    public String getPurpose() {
        return purpose;
    }
    
    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}

