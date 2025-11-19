package com.duanruo.exam.infrastructure.persistence.jpa;

import com.duanruo.exam.domain.audit.AuditAction;
import com.duanruo.exam.domain.audit.AuditResult;
import com.duanruo.exam.infrastructure.persistence.entity.AuditLogEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 审计日志JPA仓储
 * 
 * @author Augment Agent
 * @since 2025-10-25
 */
@Repository
public interface JpaAuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {
    
    /**
     * 根据租户ID查询
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE a.tenantId = :tenantId ORDER BY a.timestamp DESC")
    List<AuditLogEntity> findByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);
    
    /**
     * 根据用户ID查询
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE a.userId = :userId ORDER BY a.timestamp DESC")
    List<AuditLogEntity> findByUserId(@Param("userId") UUID userId, Pageable pageable);
    
    /**
     * 根据操作类型查询
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE a.action = :action ORDER BY a.timestamp DESC")
    List<AuditLogEntity> findByAction(@Param("action") AuditAction action, Pageable pageable);
    
    /**
     * 根据结果查询
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE a.result = :result ORDER BY a.timestamp DESC")
    List<AuditLogEntity> findByResult(@Param("result") AuditResult result, Pageable pageable);
    
    /**
     * 根据时间范围查询
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE a.timestamp BETWEEN :start AND :end ORDER BY a.timestamp DESC")
    List<AuditLogEntity> findByTimeRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);
    
    /**
     * 根据资源类型和ID查询
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE a.resourceType = :resourceType " +
           "AND a.resourceId = :resourceId ORDER BY a.timestamp DESC")
    List<AuditLogEntity> findByResource(
            @Param("resourceType") String resourceType,
            @Param("resourceId") String resourceId,
            Pageable pageable);
    
    /**
     * 复合条件查询
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE " +
           "(:tenantId IS NULL OR a.tenantId = :tenantId) " +
           "AND (:userId IS NULL OR a.userId = :userId) " +
           "AND (:action IS NULL OR a.action = :action) " +
           "AND (:result IS NULL OR a.result = :result) " +
           "AND (:startTime IS NULL OR a.timestamp >= :startTime) " +
           "AND (:endTime IS NULL OR a.timestamp <= :endTime) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLogEntity> findByConditions(
            @Param("tenantId") UUID tenantId,
            @Param("userId") UUID userId,
            @Param("action") AuditAction action,
            @Param("result") AuditResult result,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    /**
     * 统计租户审计日志数量
     */
    @Query("SELECT COUNT(a) FROM AuditLogEntity a WHERE a.tenantId = :tenantId")
    long countByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * 统计失败操作数量
     */
    @Query("SELECT COUNT(a) FROM AuditLogEntity a WHERE a.tenantId = :tenantId " +
           "AND a.result IN ('FAILURE', 'SYSTEM_ERROR', 'BUSINESS_ERROR') " +
           "AND a.timestamp >= :since")
    long countFailuresByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("since") LocalDateTime since);

    /**
     * 统计权限拒绝数量
     */
    @Query("SELECT COUNT(a) FROM AuditLogEntity a WHERE a.tenantId = :tenantId " +
           "AND a.result = 'PERMISSION_DENIED' " +
           "AND a.timestamp >= :since")
    long countPermissionDeniedByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("since") LocalDateTime since);
}

