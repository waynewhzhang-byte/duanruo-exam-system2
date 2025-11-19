package com.duanruo.exam.domain.user;

import com.duanruo.exam.shared.domain.AggregateRoot;
import com.duanruo.exam.shared.domain.TenantId;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * 用户聚合根
 */
public class User extends AggregateRoot<UserId> {

    private String username;
    private String email;
    private String passwordHash;
    private String fullName;
    private String phoneNumber;
    private UserStatus status;
    private Set<Role> roles;
    private TenantId tenantId;  // 用户所属租户（系统管理员为null）
    private LocalDateTime lastLoginAt;
    private LocalDateTime passwordChangedAt;
    private boolean emailVerified;
    private boolean phoneVerified;
    private String department;
    private String jobTitle;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 构造函数
    protected User() {
        super();
    }

    public User(UserId id, String username, String email, String passwordHash, 
                String fullName, Set<Role> roles) {
        super(id);
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.roles = roles;
        this.status = UserStatus.ACTIVE;
        this.emailVerified = false;
        this.phoneVerified = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查用户是否有指定角色
     */
    public boolean hasRole(Role role) {
        return roles != null && roles.contains(role);
    }

    /**
     * 检查用户是否有任一指定角色
     */
    public boolean hasAnyRole(Role... roles) {
        if (this.roles == null || this.roles.isEmpty()) {
            return false;
        }
        for (Role role : roles) {
            if (this.roles.contains(role)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查用户是否有指定权限
     */
    public boolean hasPermission(Permission permission) {
        if (roles == null || roles.isEmpty()) {
            return false;
        }
        return roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .anyMatch(p -> p.equals(permission));
    }

    /**
     * 添加角色
     */
    public void addRole(Role role) {
        if (this.roles == null) {
            this.roles = Set.of(role);
        } else {
            this.roles = Set.copyOf(
                java.util.stream.Stream.concat(
                    this.roles.stream(),
                    java.util.stream.Stream.of(role)
                ).collect(java.util.stream.Collectors.toSet())
            );
        }
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 移除角色
     */
    public void removeRole(Role role) {
        if (this.roles != null) {
            this.roles = this.roles.stream()
                    .filter(r -> !r.equals(role))
                    .collect(java.util.stream.Collectors.toSet());
            this.updatedAt = LocalDateTime.now();
        }
    }

    /**
     * 更新最后登录时间
     */
    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 更改密码
     */
    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.passwordChangedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 激活用户
     */
    public void activate() {
        this.status = UserStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 停用用户
     */
    public void deactivate() {
        this.status = UserStatus.INACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 锁定用户
     */
    public void lock() {
        this.status = UserStatus.LOCKED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 验证邮箱
     */
    public void verifyEmail() {
        this.emailVerified = true;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 验证手机
     */
    public void verifyPhone() {
        this.phoneVerified = true;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查用户是否可以登录
     */
    public boolean canLogin() {
        return status == UserStatus.ACTIVE;
    }

    // Getters
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getFullName() { return fullName; }
    public String getPhoneNumber() { return phoneNumber; }
    public UserStatus getStatus() { return status; }
    public Set<Role> getRoles() { return roles; }
    public TenantId getTenantId() { return tenantId; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public LocalDateTime getPasswordChangedAt() { return passwordChangedAt; }
    public boolean isEmailVerified() { return emailVerified; }
    public boolean isPhoneVerified() { return phoneVerified; }
    public String getDepartment() { return department; }
    public String getJobTitle() { return jobTitle; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters for mutable fields
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
        this.updatedAt = LocalDateTime.now();
    }

    public void setDepartment(String department) {
        this.department = department;
        this.updatedAt = LocalDateTime.now();
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
        this.updatedAt = LocalDateTime.now();
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
        this.updatedAt = LocalDateTime.now();
    }

    public void setTenantId(TenantId tenantId) {
        this.tenantId = tenantId;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查用户是否属于指定租户
     */
    public boolean belongsToTenant(TenantId tenantId) {
        if (this.tenantId == null) {
            return false; // 系统管理员不属于任何租户
        }
        return this.tenantId.equals(tenantId);
    }

    /**
     * 检查用户是否为系统管理员（不属于任何租户）
     */
    public boolean isSystemAdmin() {
        return this.tenantId == null && hasAnyRole(Role.SUPER_ADMIN);
    }

    /**
     * 检查用户是否为租户管理员
     */
    public boolean isTenantAdmin() {
        return this.tenantId != null && hasAnyRole(Role.TENANT_ADMIN);
    }
}
