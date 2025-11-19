package com.duanruo.exam.infrastructure.persistence.entity;

import com.duanruo.exam.infrastructure.security.AESAttributeConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 用户实体
 * 用户是跨租户共享的，存储在public schema
 */
@Entity
@Table(name = "users", schema = "public")
public class UserEntity {

    @Id
    private UUID id;

    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;

    @Convert(converter = AESAttributeConverter.class)
    @Column(name = "email", unique = true, nullable = false, length = 500)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Convert(converter = AESAttributeConverter.class)
    @Column(name = "full_name", nullable = false, length = 500)
    private String fullName;

    @Convert(converter = AESAttributeConverter.class)
    @Column(name = "phone_number", unique = true, length = 500)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private UserStatus status;

    @Column(name = "roles", columnDefinition = "TEXT")
    private String roles; // JSON格式存储角色列表

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Column(name = "phone_verified")
    private Boolean phoneVerified = false;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version")
    private Long version;

    // 构造函数
    public UserEntity() {}

    public UserEntity(UUID id, String username, String email, String passwordHash, 
                     String fullName, String roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.roles = roles;
        this.status = UserStatus.ACTIVE;
        this.emailVerified = false;
        this.phoneVerified = false;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public String getRoles() { return roles; }
    public void setRoles(String roles) { this.roles = roles; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public LocalDateTime getPasswordChangedAt() { return passwordChangedAt; }
    public void setPasswordChangedAt(LocalDateTime passwordChangedAt) { this.passwordChangedAt = passwordChangedAt; }

    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public Boolean getPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(Boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    /**
     * 用户状态枚举
     */
    public enum UserStatus {
        ACTIVE,
        INACTIVE,
        LOCKED,
        PENDING_VERIFICATION,
        DELETED
    }
}
