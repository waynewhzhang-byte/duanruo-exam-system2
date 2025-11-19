package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 用户-租户-角色关联JPA实体
 */
@Entity
@Table(name = "user_tenant_roles", schema = "public",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "tenant_id", "role"}))
public class UserTenantRoleEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "role", nullable = false, length = 50)
    private String role;
    
    @CreationTimestamp
    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;
    
    @Column(name = "granted_by")
    private UUID grantedBy;
    
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
    
    @Column(name = "revoked_by")
    private UUID revokedBy;
    
    @Column(name = "active", nullable = false)
    private Boolean active = true;
    
    // 构造函数
    public UserTenantRoleEntity() {}

    public UserTenantRoleEntity(UUID id, UUID userId, UUID tenantId, String role) {
        this.id = id;
        this.userId = userId;
        this.tenantId = tenantId;
        this.role = role;
        this.active = true;
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
    
    public UUID getTenantId() {
        return tenantId;
    }
    
    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }
    
    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
    
    public LocalDateTime getGrantedAt() {
        return grantedAt;
    }
    
    public void setGrantedAt(LocalDateTime grantedAt) {
        this.grantedAt = grantedAt;
    }
    
    public UUID getGrantedBy() {
        return grantedBy;
    }
    
    public void setGrantedBy(UUID grantedBy) {
        this.grantedBy = grantedBy;
    }
    
    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }
    
    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }
    
    public UUID getRevokedBy() {
        return revokedBy;
    }
    
    public void setRevokedBy(UUID revokedBy) {
        this.revokedBy = revokedBy;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
    }
}

