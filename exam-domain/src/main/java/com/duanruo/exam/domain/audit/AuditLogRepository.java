package com.duanruo.exam.domain.audit;

import com.duanruo.exam.domain.user.UserId;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 审计日志仓储接口
 */
public interface AuditLogRepository {
    
    /**
     * 保存审计日志
     */
    void save(AuditLog auditLog);
    
    /**
     * 根据ID查询
     */
    AuditLog findById(UUID id);
    
    /**
     * 根据租户ID查询
     */
    List<AuditLog> findByTenantId(UUID tenantId, int page, int size);
    
    /**
     * 根据用户ID查询
     */
    List<AuditLog> findByUserId(UserId userId, int page, int size);
    
    /**
     * 根据操作类型查询
     */
    List<AuditLog> findByAction(AuditAction action, int page, int size);
    
    /**
     * 根据结果查询
     */
    List<AuditLog> findByResult(AuditResult result, int page, int size);
    
    /**
     * 根据时间范围查询
     */
    List<AuditLog> findByTimeRange(LocalDateTime start, LocalDateTime end, int page, int size);
    
    /**
     * 根据资源类型和ID查询
     */
    List<AuditLog> findByResource(String resourceType, String resourceId, int page, int size);
    
    /**
     * 复合查询
     */
    List<AuditLog> findByConditions(
        UUID tenantId,
        UserId userId,
        AuditAction action,
        AuditResult result,
        LocalDateTime startTime,
        LocalDateTime endTime,
        int page,
        int size
    );

    /**
     * 统计审计日志数量
     */
    long countByTenantId(UUID tenantId);

    /**
     * 统计失败操作数量
     */
    long countFailuresByTenantId(UUID tenantId, LocalDateTime since);

    /**
     * 统计权限拒绝数量
     */
    long countPermissionDeniedByTenantId(UUID tenantId, LocalDateTime since);
}

