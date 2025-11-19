package com.duanruo.exam.domain.tenant;

import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.shared.domain.TenantId;
import com.duanruo.exam.shared.exception.DomainException;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * 用户-租户-角色关联实体
 * 表示用户在特定租户下的角色
 */
public class UserTenantRole {
    
    private UUID id;
    private UserId userId;
    private TenantId tenantId;
    private Role role;
    private LocalDateTime grantedAt;
    private UUID grantedBy;
    private LocalDateTime revokedAt;
    private UUID revokedBy;
    private boolean active;
    
    private UserTenantRole() {}
    
    /**
     * 创建用户租户角色关联
     */
    public static UserTenantRole create(
            UserId userId,
            TenantId tenantId,
            Role role,
            UUID grantedBy
    ) {
        validateRole(role);
        
        UserTenantRole utr = new UserTenantRole();
        utr.id = UUID.randomUUID();
        utr.userId = Objects.requireNonNull(userId, "UserId cannot be null");
        utr.tenantId = Objects.requireNonNull(tenantId, "TenantId cannot be null");
        utr.role = role;
        utr.grantedAt = LocalDateTime.now();
        utr.grantedBy = grantedBy;
        utr.active = true;
        
        return utr;
    }
    
    /**
     * 重建用户租户角色关联（从数据库加载）
     */
    public static UserTenantRole rebuild(
            UUID id,
            UserId userId,
            TenantId tenantId,
            Role role,
            LocalDateTime grantedAt,
            UUID grantedBy,
            LocalDateTime revokedAt,
            UUID revokedBy,
            boolean active
    ) {
        UserTenantRole utr = new UserTenantRole();
        utr.id = id;
        utr.userId = userId;
        utr.tenantId = tenantId;
        utr.role = role;
        utr.grantedAt = grantedAt;
        utr.grantedBy = grantedBy;
        utr.revokedAt = revokedAt;
        utr.revokedBy = revokedBy;
        utr.active = active;
        
        return utr;
    }
    
    /**
     * 撤销角色
     */
    public void revoke(UUID revokedBy) {
        if (!active) {
            throw new UserTenantRoleException("Role is already revoked");
        }
        
        this.active = false;
        this.revokedAt = LocalDateTime.now();
        this.revokedBy = revokedBy;
    }
    
    /**
     * 重新激活角色
     */
    public void reactivate(UUID grantedBy) {
        if (active) {
            throw new UserTenantRoleException("Role is already active");
        }
        
        this.active = true;
        this.grantedAt = LocalDateTime.now();
        this.grantedBy = grantedBy;
        this.revokedAt = null;
        this.revokedBy = null;
    }
    
    /**
     * 验证角色是否为租户级角色
     */
    private static void validateRole(Role role) {
        // SUPER_ADMIN不应该通过UserTenantRole分配，应该直接在User实体中设置
        if (role == Role.ADMIN) {
            throw new UserTenantRoleException("SUPER_ADMIN role should not be assigned through UserTenantRole");
        }
    }
    
    // Getters
    public UUID getId() {
        return id;
    }
    
    public UserId getUserId() {
        return userId;
    }
    
    public TenantId getTenantId() {
        return tenantId;
    }
    
    public Role getRole() {
        return role;
    }
    
    public LocalDateTime getGrantedAt() {
        return grantedAt;
    }
    
    public UUID getGrantedBy() {
        return grantedBy;
    }
    
    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }
    
    public UUID getRevokedBy() {
        return revokedBy;
    }
    
    public boolean isActive() {
        return active;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserTenantRole that = (UserTenantRole) o;
        return Objects.equals(id, that.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    // 异常类
    public static class UserTenantRoleException extends DomainException {
        public UserTenantRoleException(String message) {
            super("USER_TENANT_ROLE_ERROR", message);
        }
    }
}

