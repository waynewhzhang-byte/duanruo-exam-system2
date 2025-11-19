package com.duanruo.exam.domain.tenant;

import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.shared.domain.TenantId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 用户租户角色仓储接口
 */
public interface UserTenantRoleRepository {
    
    /**
     * 保存用户租户角色
     */
    void save(UserTenantRole userTenantRole);
    
    /**
     * 根据ID查找
     */
    Optional<UserTenantRole> findById(UUID id);
    
    /**
     * 查找用户在特定租户下的所有激活角色
     */
    List<UserTenantRole> findActiveRolesByUserAndTenant(UserId userId, TenantId tenantId);
    
    /**
     * 查找用户在特定租户下的特定角色
     */
    Optional<UserTenantRole> findByUserTenantAndRole(UserId userId, TenantId tenantId, Role role);
    
    /**
     * 查找用户的所有租户角色
     */
    List<UserTenantRole> findAllByUser(UserId userId);
    
    /**
     * 查找租户下的所有用户角色
     */
    List<UserTenantRole> findAllByTenant(TenantId tenantId);
    
    /**
     * 查找租户下特定角色的所有用户
     */
    List<UserTenantRole> findAllByTenantAndRole(TenantId tenantId, Role role);
    
    /**
     * 检查用户在租户下是否有特定角色
     */
    boolean hasRole(UserId userId, TenantId tenantId, Role role);
    
    /**
     * 检查用户是否属于租户
     */
    boolean belongsToTenant(UserId userId, TenantId tenantId);
    
    /**
     * 删除用户租户角色
     */
    void delete(UUID id);
    
    /**
     * 删除用户在租户下的所有角色
     */
    void deleteAllByUserAndTenant(UserId userId, TenantId tenantId);
}

