package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.UserTenantRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 用户租户角色Spring Data JPA Repository
 */
@Repository
public interface JpaUserTenantRoleRepository extends JpaRepository<UserTenantRoleEntity, UUID> {
    
    /**
     * 查找用户在特定租户下的所有激活角色
     */
    @Query("SELECT utr FROM UserTenantRoleEntity utr " +
           "WHERE utr.userId = :userId AND utr.tenantId = :tenantId AND utr.active = true")
    List<UserTenantRoleEntity> findActiveRolesByUserAndTenant(
            @Param("userId") UUID userId, 
            @Param("tenantId") UUID tenantId);
    
    /**
     * 查找用户在特定租户下的特定角色
     */
    Optional<UserTenantRoleEntity> findByUserIdAndTenantIdAndRole(
            UUID userId, UUID tenantId, String role);

    /**
     * 查找用户的所有租户角色
     */
    List<UserTenantRoleEntity> findAllByUserId(UUID userId);

    /**
     * 查找用户的所有激活租户角色
     */
    @Query("SELECT utr FROM UserTenantRoleEntity utr WHERE utr.userId = :userId AND utr.active = true")
    List<UserTenantRoleEntity> findAllActiveByUserId(@Param("userId") UUID userId);

    /**
     * 查找租户下的所有用户角色
     */
    List<UserTenantRoleEntity> findAllByTenantId(UUID tenantId);

    /**
     * 查找租户下特定角色的所有用户
     */
    @Query("SELECT utr FROM UserTenantRoleEntity utr " +
           "WHERE utr.tenantId = :tenantId AND utr.role = :role AND utr.active = true")
    List<UserTenantRoleEntity> findAllByTenantIdAndRole(
            @Param("tenantId") UUID tenantId,
            @Param("role") String role);

    /**
     * 检查用户在租户下是否有特定角色
     */
    @Query("SELECT CASE WHEN COUNT(utr) > 0 THEN true ELSE false END " +
           "FROM UserTenantRoleEntity utr " +
           "WHERE utr.userId = :userId AND utr.tenantId = :tenantId " +
           "AND utr.role = :role AND utr.active = true")
    boolean hasRole(
            @Param("userId") UUID userId,
            @Param("tenantId") UUID tenantId,
            @Param("role") String role);
    
    /**
     * 检查用户是否属于租户
     */
    @Query("SELECT CASE WHEN COUNT(utr) > 0 THEN true ELSE false END " +
           "FROM UserTenantRoleEntity utr " +
           "WHERE utr.userId = :userId AND utr.tenantId = :tenantId AND utr.active = true")
    boolean belongsToTenant(@Param("userId") UUID userId, @Param("tenantId") UUID tenantId);
    
    /**
     * 删除用户在租户下的所有角色
     */
    void deleteAllByUserIdAndTenantId(UUID userId, UUID tenantId);
}

