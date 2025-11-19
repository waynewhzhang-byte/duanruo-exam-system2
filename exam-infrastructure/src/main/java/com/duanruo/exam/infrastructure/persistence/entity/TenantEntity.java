package com.duanruo.exam.infrastructure.persistence.entity;

import com.duanruo.exam.domain.tenant.TenantStatus;
import com.duanruo.exam.infrastructure.security.AESAttributeConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 租户JPA实体
 */
@Entity
@Table(name = "tenants", schema = "public")
public class TenantEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Column(name = "code", unique = true, nullable = false, length = 50)
    private String code;
    
    @Column(name = "schema_name", unique = true, nullable = false, length = 63)
    private String schemaName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TenantStatus status;
    
    @Convert(converter = AESAttributeConverter.class)
    @Column(name = "contact_email", nullable = false, length = 500)
    private String contactEmail;

    @Convert(converter = AESAttributeConverter.class)
    @Column(name = "contact_phone", length = 500)
    private String contactPhone;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "activated_at")
    private LocalDateTime activatedAt;
    
    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;
    
    // 构造函数
    public TenantEntity() {}
    
    public TenantEntity(UUID id, String name, String code, String schemaName) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.schemaName = schemaName;
        this.status = TenantStatus.PENDING;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getSchemaName() {
        return schemaName;
    }
    
    public void setSchemaName(String schemaName) {
        this.schemaName = schemaName;
    }
    
    public TenantStatus getStatus() {
        return status;
    }
    
    public void setStatus(TenantStatus status) {
        this.status = status;
    }
    
    public String getContactEmail() {
        return contactEmail;
    }
    
    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public LocalDateTime getActivatedAt() {
        return activatedAt;
    }
    
    public void setActivatedAt(LocalDateTime activatedAt) {
        this.activatedAt = activatedAt;
    }
    
    public LocalDateTime getDeactivatedAt() {
        return deactivatedAt;
    }
    
    public void setDeactivatedAt(LocalDateTime deactivatedAt) {
        this.deactivatedAt = deactivatedAt;
    }
}

