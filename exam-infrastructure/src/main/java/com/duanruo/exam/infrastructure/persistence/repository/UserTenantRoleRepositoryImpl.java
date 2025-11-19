package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.tenant.UserTenantRole;
import com.duanruo.exam.domain.tenant.UserTenantRoleRepository;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.infrastructure.persistence.mapper.UserTenantRoleMapper;
import com.duanruo.exam.shared.domain.TenantId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 用户租户角色仓储实现
 */
@Repository
public class UserTenantRoleRepositoryImpl implements UserTenantRoleRepository {

    private static final Logger logger = LoggerFactory.getLogger(UserTenantRoleRepositoryImpl.class);

    private final JpaUserTenantRoleRepository jpaRepository;
    private final UserTenantRoleMapper mapper;
    
    public UserTenantRoleRepositoryImpl(
            JpaUserTenantRoleRepository jpaRepository,
            UserTenantRoleMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }
    
    @Override
    @Transactional
    public void save(UserTenantRole userTenantRole) {
        var entity = mapper.toEntity(userTenantRole);
        jpaRepository.save(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserTenantRole> findById(UUID id) {
        return jpaRepository.findById(id)
            .map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserTenantRole> findActiveRolesByUserAndTenant(UserId userId, TenantId tenantId) {
        return jpaRepository.findActiveRolesByUserAndTenant(
                userId.getValue(), 
                tenantId.getValue())
            .stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserTenantRole> findByUserTenantAndRole(UserId userId, TenantId tenantId, Role role) {
        return jpaRepository.findByUserIdAndTenantIdAndRole(
                userId.getValue(),
                tenantId.getValue(),
                role.getName())
            .map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserTenantRole> findAllByUser(UserId userId) {
        return jpaRepository.findAllByUserId(userId.getValue())
            .stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserTenantRole> findAllByTenant(TenantId tenantId) {
        return jpaRepository.findAllByTenantId(tenantId.getValue())
            .stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserTenantRole> findAllByTenantAndRole(TenantId tenantId, Role role) {
        return jpaRepository.findAllByTenantIdAndRole(
                tenantId.getValue(),
                role.getName())
            .stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasRole(UserId userId, TenantId tenantId, Role role) {
        return jpaRepository.hasRole(
            userId.getValue(),
            tenantId.getValue(),
            role.getName());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean belongsToTenant(UserId userId, TenantId tenantId) {
        logger.info("UserTenantRoleRepositoryImpl.belongsToTenant called with userId={}, tenantId={}",
            userId.getValue(), tenantId.getValue());
        boolean result = jpaRepository.belongsToTenant(
            userId.getValue(),
            tenantId.getValue());
        logger.info("UserTenantRoleRepositoryImpl.belongsToTenant result={}", result);
        return result;
    }
    
    @Override
    @Transactional
    public void delete(UUID id) {
        jpaRepository.deleteById(id);
    }
    
    @Override
    @Transactional
    public void deleteAllByUserAndTenant(UserId userId, TenantId tenantId) {
        jpaRepository.deleteAllByUserIdAndTenantId(
            userId.getValue(), 
            tenantId.getValue());
    }
}

