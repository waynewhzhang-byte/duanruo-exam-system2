package com.duanruo.exam.adapter.scheduler;

import com.duanruo.exam.application.tenant.TenantBackupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 备份清理定时任务
 * 自动清理过期的租户备份
 */
@Component
@ConditionalOnProperty(prefix = "app.tenant.backup.auto-cleanup", name = "enabled", havingValue = "true", matchIfMissing = true)
public class BackupCleanupScheduler {
    
    private static final Logger logger = LoggerFactory.getLogger(BackupCleanupScheduler.class);
    
    private final TenantBackupService backupService;
    private final int retentionDays;
    
    public BackupCleanupScheduler(
        TenantBackupService backupService,
        @Value("${app.tenant.backup.retention-days:30}") int retentionDays
    ) {
        this.backupService = backupService;
        this.retentionDays = retentionDays;
    }
    
    /**
     * 定时清理过期备份
     * 默认每天凌晨2点执行
     */
    @Scheduled(cron = "${app.tenant.backup.auto-cleanup.cron:0 0 2 * * ?}")
    public void cleanupExpiredBackups() {
        logger.info("开始执行备份清理任务，保留天数: {}", retentionDays);
        
        try {
            int cleanedCount = backupService.cleanupExpiredBackups(retentionDays);
            logger.info("备份清理任务完成，清理了 {} 个过期备份", cleanedCount);
        } catch (Exception e) {
            logger.error("备份清理任务执行失败", e);
        }
    }
}

