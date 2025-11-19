package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.tenant.UserTenantRole;
import com.duanruo.exam.domain.tenant.UserTenantRoleRepository;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import com.duanruo.exam.shared.domain.TenantId;
import com.duanruo.exam.shared.exception.ApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 用户租户角色应用服务
 * 处理用户在租户下的角色管理
 */
@Service
public class UserTenantRoleApplicationService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserTenantRoleApplicationService.class);
    
    private final UserTenantRoleRepository userTenantRoleRepository;
    private final UserRepository userRepository;
    
    public UserTenantRoleApplicationService(
            UserTenantRoleRepository userTenantRoleRepository,
            UserRepository userRepository) {
        this.userTenantRoleRepository = userTenantRoleRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * 授予用户在租户下的角色
     */
    @Transactional
    public void grantRole(UUID userId, UUID tenantId, Role role, UUID grantedBy) {
        logger.info("Granting role {} to user {} in tenant {}", role, userId, tenantId);

        // 验证用户存在
        UserId userIdObj = UserId.of(userId);
        userRepository.findById(userIdObj)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        // 检查是否已有该角色
        TenantId tenantIdObj = TenantId.of(tenantId);
        boolean hasRole = userTenantRoleRepository.hasRole(userIdObj, tenantIdObj, role);
        if (hasRole) {
            throw new RoleAlreadyGrantedException(
                "User already has role " + role + " in tenant " + tenantId);
        }

        // 创建用户租户角色
        UserTenantRole userTenantRole = UserTenantRole.create(
            userIdObj,
            tenantIdObj,
            role,
            grantedBy
        );

        userTenantRoleRepository.save(userTenantRole);

        logger.info("Role {} granted successfully to user {} in tenant {}", role, userId, tenantId);
    }
    
    /**
     * 撤销用户在租户下的角色
     */
    @Transactional
    public void revokeRole(UUID userId, UUID tenantId, Role role, UUID revokedBy) {
        logger.info("Revoking role {} from user {} in tenant {}", role, userId, tenantId);
        
        UserId userIdObj = UserId.of(userId);
        TenantId tenantIdObj = TenantId.of(tenantId);
        
        // 查找用户租户角色
        UserTenantRole userTenantRole = userTenantRoleRepository
            .findByUserTenantAndRole(userIdObj, tenantIdObj, role)
            .orElseThrow(() -> new RoleNotFoundException(
                "User does not have role " + role + " in tenant " + tenantId));
        
        // 撤销角色
        userTenantRole.revoke(revokedBy);
        userTenantRoleRepository.save(userTenantRole);
        
        logger.info("Role {} revoked successfully from user {} in tenant {}", role, userId, tenantId);
    }
    
    /**
     * 获取用户在租户下的所有角色
     */
    @Transactional(readOnly = true)
    public List<Role> getUserRolesInTenant(UUID userId, UUID tenantId) {
        UserId userIdObj = UserId.of(userId);
        TenantId tenantIdObj = TenantId.of(tenantId);
        
        return userTenantRoleRepository
            .findActiveRolesByUserAndTenant(userIdObj, tenantIdObj)
            .stream()
            .map(UserTenantRole::getRole)
            .collect(Collectors.toList());
    }
    
    /**
     * 获取用户的所有租户
     */
    @Transactional(readOnly = true)
    public List<TenantId> getUserTenants(UUID userId) {
        UserId userIdObj = UserId.of(userId);
        
        return userTenantRoleRepository
            .findAllByUser(userIdObj)
            .stream()
            .filter(UserTenantRole::isActive)
            .map(UserTenantRole::getTenantId)
            .distinct()
            .collect(Collectors.toList());
    }
    
    /**
     * 获取租户下的所有用户
     */
    @Transactional(readOnly = true)
    public List<UserId> getTenantUsers(UUID tenantId) {
        TenantId tenantIdObj = TenantId.of(tenantId);
        
        return userTenantRoleRepository
            .findAllByTenant(tenantIdObj)
            .stream()
            .filter(UserTenantRole::isActive)
            .map(UserTenantRole::getUserId)
            .distinct()
            .collect(Collectors.toList());
    }
    
    /**
     * 获取租户下特定角色的所有用户
     */
    @Transactional(readOnly = true)
    public List<UserId> getTenantUsersByRole(UUID tenantId, Role role) {
        TenantId tenantIdObj = TenantId.of(tenantId);
        
        return userTenantRoleRepository
            .findAllByTenantAndRole(tenantIdObj, role)
            .stream()
            .filter(UserTenantRole::isActive)
            .map(UserTenantRole::getUserId)
            .collect(Collectors.toList());
    }
    
    /**
     * 检查用户是否在租户下有特定角色
     */
    @Transactional(readOnly = true)
    public boolean hasRole(UUID userId, UUID tenantId, Role role) {
        UserId userIdObj = UserId.of(userId);
        TenantId tenantIdObj = TenantId.of(tenantId);
        
        return userTenantRoleRepository.hasRole(userIdObj, tenantIdObj, role);
    }
    
    /**
     * 检查用户是否属于租户
     */
    @Transactional(readOnly = true)
    public boolean belongsToTenant(UUID userId, UUID tenantId) {
        UserId userIdObj = UserId.of(userId);
        TenantId tenantIdObj = TenantId.of(tenantId);
        
        return userTenantRoleRepository.belongsToTenant(userIdObj, tenantIdObj);
    }
    
    /**
     * 移除用户在租户下的所有角色
     */
    @Transactional
    public void removeUserFromTenant(UUID userId, UUID tenantId) {
        logger.info("Removing user {} from tenant {}", userId, tenantId);
        
        UserId userIdObj = UserId.of(userId);
        TenantId tenantIdObj = TenantId.of(tenantId);
        
        userTenantRoleRepository.deleteAllByUserAndTenant(userIdObj, tenantIdObj);
        
        logger.info("User {} removed from tenant {} successfully", userId, tenantId);
    }
    
    // 异常类
    public static class UserNotFoundException extends ApplicationException {
        public UserNotFoundException(String message) {
            super(message);
        }
    }
    
    public static class RoleAlreadyGrantedException extends ApplicationException {
        public RoleAlreadyGrantedException(String message) {
            super(message);
        }
    }
    
    public static class RoleNotFoundException extends ApplicationException {
        public RoleNotFoundException(String message) {
            super(message);
        }
    }
}

