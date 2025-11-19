package com.duanruo.exam.domain.tenant;

import com.duanruo.exam.shared.domain.AggregateRoot;
import com.duanruo.exam.shared.domain.TenantId;
import com.duanruo.exam.shared.exception.DomainException;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 租户聚合根
 * 用于SAAS多租户架构
 */
public class Tenant extends AggregateRoot<TenantId> {
    
    private String name;
    private String code; // 租户唯一标识码
    private String schemaName; // 数据库Schema名称
    private TenantStatus status;
    private String contactEmail;
    private String contactPhone;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime activatedAt;
    private LocalDateTime deactivatedAt;
    
    // 私有构造函数
    private Tenant() {
        super();
    }
    
    /**
     * 创建新租户
     */
    public static Tenant create(
            TenantId id,
            String name,
            String code,
            String contactEmail,
            String contactPhone,
            String description
    ) {
        validateName(name);
        validateCode(code);
        validateContactEmail(contactEmail);
        
        Tenant tenant = new Tenant();
        tenant.setId(id);
        tenant.name = name;
        tenant.code = code;
        tenant.schemaName = generateSchemaName(code);
        tenant.status = TenantStatus.PENDING;
        tenant.contactEmail = contactEmail;
        tenant.contactPhone = contactPhone;
        tenant.description = description;
        tenant.createdAt = LocalDateTime.now();
        tenant.updatedAt = LocalDateTime.now();
        
        return tenant;
    }
    
    /**
     * 重建租户（从数据库加载）
     */
    public static Tenant rebuild(
            TenantId id,
            String name,
            String code,
            String schemaName,
            TenantStatus status,
            String contactEmail,
            String contactPhone,
            String description,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            LocalDateTime activatedAt,
            LocalDateTime deactivatedAt
    ) {
        Tenant tenant = new Tenant();
        tenant.setId(id);
        tenant.name = name;
        tenant.code = code;
        tenant.schemaName = schemaName;
        tenant.status = status;
        tenant.contactEmail = contactEmail;
        tenant.contactPhone = contactPhone;
        tenant.description = description;
        tenant.createdAt = createdAt;
        tenant.updatedAt = updatedAt;
        tenant.activatedAt = activatedAt;
        tenant.deactivatedAt = deactivatedAt;
        
        return tenant;
    }
    
    /**
     * 激活租户
     */
    public void activate() {
        if (status == TenantStatus.ACTIVE) {
            throw new TenantOperationException("Tenant is already active");
        }
        if (status == TenantStatus.DELETED) {
            throw new TenantOperationException("Cannot activate deleted tenant");
        }
        
        this.status = TenantStatus.ACTIVE;
        this.activatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 停用租户
     */
    public void deactivate() {
        if (status == TenantStatus.INACTIVE) {
            throw new TenantOperationException("Tenant is already inactive");
        }
        if (status == TenantStatus.DELETED) {
            throw new TenantOperationException("Cannot deactivate deleted tenant");
        }
        
        this.status = TenantStatus.INACTIVE;
        this.deactivatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 删除租户（软删除）
     */
    public void delete() {
        if (status == TenantStatus.DELETED) {
            throw new TenantOperationException("Tenant is already deleted");
        }
        
        this.status = TenantStatus.DELETED;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 更新租户信息
     */
    public void updateInfo(String name, String contactEmail, String contactPhone, String description) {
        if (status == TenantStatus.DELETED) {
            throw new TenantOperationException("Cannot update deleted tenant");
        }
        
        if (name != null && !name.isBlank()) {
            validateName(name);
            this.name = name;
        }
        if (contactEmail != null && !contactEmail.isBlank()) {
            validateContactEmail(contactEmail);
            this.contactEmail = contactEmail;
        }
        if (contactPhone != null) {
            this.contactPhone = contactPhone;
        }
        if (description != null) {
            this.description = description;
        }
        
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 检查租户是否激活
     */
    public boolean isActive() {
        return status == TenantStatus.ACTIVE;
    }
    
    // 验证方法
    private static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new TenantCreationException("Tenant name cannot be empty");
        }
        if (name.length() > 100) {
            throw new TenantCreationException("Tenant name cannot exceed 100 characters");
        }
    }
    
    private static void validateCode(String code) {
        if (code == null || code.isBlank()) {
            throw new TenantCreationException("Tenant code cannot be empty");
        }
        if (!code.matches("^[a-z0-9_-]+$")) {
            throw new TenantCreationException("Tenant code must contain only lowercase letters, numbers, hyphens and underscores");
        }
        if (code.length() > 50) {
            throw new TenantCreationException("Tenant code cannot exceed 50 characters");
        }
    }
    
    private static void validateContactEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new TenantCreationException("Contact email cannot be empty");
        }
        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new TenantCreationException("Invalid email format");
        }
    }
    
    /**
     * 生成Schema名称
     */
    private static String generateSchemaName(String code) {
        return "tenant_" + code;
    }
    
    // Getters
    public String getName() {
        return name;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getSchemaName() {
        return schemaName;
    }
    
    public TenantStatus getStatus() {
        return status;
    }
    
    public String getContactEmail() {
        return contactEmail;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public String getDescription() {
        return description;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public LocalDateTime getActivatedAt() {
        return activatedAt;
    }
    
    public LocalDateTime getDeactivatedAt() {
        return deactivatedAt;
    }
    
    // 异常类
    public static class TenantCreationException extends DomainException {
        public TenantCreationException(String message) {
            super("TENANT_CREATION_ERROR", message);
        }
    }

    public static class TenantOperationException extends DomainException {
        public TenantOperationException(String message) {
            super("TENANT_OPERATION_ERROR", message);
        }
    }
}

