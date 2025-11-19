package com.duanruo.exam.adapter.rest.dto.tenant;

import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 租户响应DTO
 */
public record TenantResponse(
    UUID id,
    String name,
    String code,
    @JsonProperty("slug") String slug, // slug字段映射到code，用于前端兼容
    String schemaName,
    TenantStatus status,
    String contactEmail,
    String contactPhone,
    String description,
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    LocalDateTime createdAt,
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    LocalDateTime updatedAt,
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    LocalDateTime activatedAt,
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    LocalDateTime deactivatedAt
) {
    
    /**
     * 从领域对象创建响应DTO
     */
    public static TenantResponse from(Tenant tenant) {
        String code = tenant.getCode();
        return new TenantResponse(
            tenant.getId().getValue(),
            tenant.getName(),
            code,
            code, // slug与code相同
            tenant.getSchemaName(),
            tenant.getStatus(),
            tenant.getContactEmail(),
            tenant.getContactPhone(),
            tenant.getDescription(),
            tenant.getCreatedAt(),
            tenant.getUpdatedAt(),
            tenant.getActivatedAt(),
            tenant.getDeactivatedAt()
        );
    }
}

