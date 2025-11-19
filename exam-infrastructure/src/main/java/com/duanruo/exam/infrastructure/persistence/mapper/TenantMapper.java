package com.duanruo.exam.infrastructure.persistence.mapper;

import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.infrastructure.persistence.entity.TenantEntity;
import com.duanruo.exam.shared.domain.TenantId;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * 租户领域对象与JPA实体映射器
 */
@Component
public class TenantMapper {
    
    /**
     * 领域对象转JPA实体
     */
    public TenantEntity toEntity(Tenant tenant) {
        Objects.requireNonNull(tenant, "Tenant domain object must not be null");
        
        TenantEntity entity = new TenantEntity();
        entity.setId(tenant.getId().getValue());
        entity.setName(tenant.getName());
        entity.setCode(tenant.getCode());
        entity.setSchemaName(tenant.getSchemaName());
        entity.setStatus(tenant.getStatus());
        entity.setContactEmail(tenant.getContactEmail());
        entity.setContactPhone(tenant.getContactPhone());
        entity.setDescription(tenant.getDescription());
        entity.setCreatedAt(tenant.getCreatedAt());
        entity.setUpdatedAt(tenant.getUpdatedAt());
        entity.setActivatedAt(tenant.getActivatedAt());
        entity.setDeactivatedAt(tenant.getDeactivatedAt());
        
        return entity;
    }
    
    /**
     * JPA实体转领域对象
     */
    public Tenant toDomain(TenantEntity entity) {
        Objects.requireNonNull(entity, "TenantEntity must not be null");
        
        return Tenant.rebuild(
            TenantId.of(entity.getId()),
            entity.getName(),
            entity.getCode(),
            entity.getSchemaName(),
            entity.getStatus(),
            entity.getContactEmail(),
            entity.getContactPhone(),
            entity.getDescription(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getActivatedAt(),
            entity.getDeactivatedAt()
        );
    }
}

