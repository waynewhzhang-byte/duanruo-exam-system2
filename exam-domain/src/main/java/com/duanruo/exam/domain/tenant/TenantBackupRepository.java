package com.duanruo.exam.domain.tenant;

import com.duanruo.exam.shared.domain.TenantId;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 租户备份仓储接口
 */
public interface TenantBackupRepository {
    
    /**
     * 保存备份记录
     */
    TenantBackup save(TenantBackup backup);
    
    /**
     * 根据ID查找备份
     */
    Optional<TenantBackup> findById(UUID id);
    
    /**
     * 查找租户的所有备份
     */
    List<TenantBackup> findByTenantId(TenantId tenantId);
    
    /**
     * 查找租户的最新备份
     */
    Optional<TenantBackup> findLatestByTenantId(TenantId tenantId);
    
    /**
     * 查找指定时间范围内的备份
     */
    List<TenantBackup> findByTenantIdAndDateRange(TenantId tenantId, Instant startDate, Instant endDate);
    
    /**
     * 查找所有过期的备份
     */
    List<TenantBackup> findExpiredBackups(Instant expirationDate);
    
    /**
     * 删除备份记录
     */
    void delete(UUID id);
    
    /**
     * 统计租户的备份数量
     */
    long countByTenantId(TenantId tenantId);
}

