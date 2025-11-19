package com.duanruo.exam.application.tenant;

import com.duanruo.exam.shared.domain.TenantId;

import java.util.List;
import java.util.UUID;

/**
 * 租户备份服务接口
 */
public interface TenantBackupService {
    
    /**
     * 创建租户全量备份
     * 
     * @param tenantId 租户ID
     * @return 备份ID
     */
    UUID createFullBackup(TenantId tenantId);
    
    /**
     * 创建租户增量备份
     * 
     * @param tenantId 租户ID
     * @param sinceBackupId 基于哪个备份的增量备份
     * @return 备份ID
     */
    UUID createIncrementalBackup(TenantId tenantId, UUID sinceBackupId);
    
    /**
     * 从备份恢复租户数据
     * 
     * @param backupId 备份ID
     * @param targetTenantId 目标租户ID（如果为null，则恢复到原租户）
     * @param overwrite 是否覆盖现有数据
     * @return 恢复任务ID
     */
    UUID restoreFromBackup(UUID backupId, TenantId targetTenantId, boolean overwrite);
    
    /**
     * 获取备份详情
     */
    TenantBackupDTO getBackupDetails(UUID backupId);
    
    /**
     * 获取租户的所有备份
     */
    List<TenantBackupDTO> getTenantBackups(TenantId tenantId);
    
    /**
     * 获取租户的最新备份
     */
    TenantBackupDTO getLatestBackup(TenantId tenantId);
    
    /**
     * 删除备份
     */
    void deleteBackup(UUID backupId);
    
    /**
     * 清理过期备份
     * 
     * @param retentionDays 保留天数
     * @return 清理的备份数量
     */
    int cleanupExpiredBackups(int retentionDays);
    
    /**
     * 验证备份完整性
     */
    BackupValidationResult validateBackup(UUID backupId);
    
    /**
     * 获取备份进度
     */
    BackupProgress getBackupProgress(UUID backupId);
    
    /**
     * 获取恢复进度
     */
    RestoreProgress getRestoreProgress(UUID restoreTaskId);
}

