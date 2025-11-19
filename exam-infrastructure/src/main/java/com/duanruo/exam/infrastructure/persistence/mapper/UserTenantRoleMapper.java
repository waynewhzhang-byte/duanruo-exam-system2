package com.duanruo.exam.infrastructure.persistence.mapper;

import com.duanruo.exam.domain.tenant.UserTenantRole;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.infrastructure.persistence.entity.UserTenantRoleEntity;
import com.duanruo.exam.shared.domain.TenantId;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * 用户租户角色领域对象与JPA实体映射器
 */
@Component
public class UserTenantRoleMapper {
    
    /**
     * 领域对象转JPA实体
     */
    public UserTenantRoleEntity toEntity(UserTenantRole userTenantRole) {
        Objects.requireNonNull(userTenantRole, "UserTenantRole domain object must not be null");

        UserTenantRoleEntity entity = new UserTenantRoleEntity();
        entity.setId(userTenantRole.getId());
        entity.setUserId(userTenantRole.getUserId().getValue());
        entity.setTenantId(userTenantRole.getTenantId().getValue());
        entity.setRole(userTenantRole.getRole().getName());  // 转换为字符串
        entity.setGrantedAt(userTenantRole.getGrantedAt());
        entity.setGrantedBy(userTenantRole.getGrantedBy());
        entity.setRevokedAt(userTenantRole.getRevokedAt());
        entity.setRevokedBy(userTenantRole.getRevokedBy());
        entity.setActive(userTenantRole.isActive());

        return entity;
    }

    /**
     * JPA实体转领域对象
     */
    public UserTenantRole toDomain(UserTenantRoleEntity entity) {
        Objects.requireNonNull(entity, "UserTenantRoleEntity must not be null");

        return UserTenantRole.rebuild(
            entity.getId(),
            UserId.of(entity.getUserId()),
            TenantId.of(entity.getTenantId()),
            Role.fromName(entity.getRole()),  // 从字符串转换为Role对象
            entity.getGrantedAt(),
            entity.getGrantedBy(),
            entity.getRevokedAt(),
            entity.getRevokedBy(),
            entity.getActive()
        );
    }
}

