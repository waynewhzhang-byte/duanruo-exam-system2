package com.duanruo.exam.application.tenant.impl;

import com.duanruo.exam.application.tenant.*;
import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantBackup;
import com.duanruo.exam.domain.tenant.TenantBackupExecutor;
import com.duanruo.exam.domain.tenant.TenantBackupRepository;
import com.duanruo.exam.domain.tenant.TenantRepository;
import com.duanruo.exam.domain.tenant.TenantRestoreExecutor;
import com.duanruo.exam.shared.domain.TenantId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 租户备份服务实现
 */
@Service
public class TenantBackupServiceImpl implements TenantBackupService {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantBackupServiceImpl.class);
    
    private final TenantBackupRepository backupRepository;
    private final TenantRepository tenantRepository;
    private final TenantBackupExecutor backupExecutor;
    private final TenantRestoreExecutor restoreExecutor;
    
    // 用于跟踪备份和恢复进度
    private final ConcurrentHashMap<UUID, BackupProgress> backupProgressMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, RestoreProgress> restoreProgressMap = new ConcurrentHashMap<>();
    
    public TenantBackupServiceImpl(
        TenantBackupRepository backupRepository,
        TenantRepository tenantRepository,
        TenantBackupExecutor backupExecutor,
        TenantRestoreExecutor restoreExecutor
    ) {
        this.backupRepository = backupRepository;
        this.tenantRepository = tenantRepository;
        this.backupExecutor = backupExecutor;
        this.restoreExecutor = restoreExecutor;
    }
    
    @Override
    @Transactional
    public UUID createFullBackup(TenantId tenantId) {
        logger.info("创建租户 {} 的全量备份", tenantId.getValue());
        
        // 1. 获取租户信息
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("租户不存在: " + tenantId.getValue()));
        
        // 2. 创建备份记录
        TenantBackup backup = TenantBackup.builder()
            .tenantId(tenantId)
            .type(TenantBackup.BackupType.FULL)
            .status(TenantBackup.BackupStatus.IN_PROGRESS)
            .startedAt(Instant.now())
            .build();
        
        TenantBackup savedBackup = backupRepository.save(backup);
        
        // 3. 异步执行备份
        executeBackupAsync(savedBackup.getId(), tenantId, tenant.getSchemaName(), tenant.getName());
        
        return savedBackup.getId();
    }
    
    @Async
    protected void executeBackupAsync(UUID backupId, TenantId tenantId, String schemaName, String tenantName) {
        try {
            // 初始化进度
            BackupProgress progress = new BackupProgress();
            progress.setBackupId(backupId);
            progress.setStatus("IN_PROGRESS");
            progress.setProgressPercentage(0);
            progress.setCurrentStep("开始备份");
            progress.setStartedAt(Instant.now());
            backupProgressMap.put(backupId, progress);
            
            // 执行备份
            TenantBackupExecutor.BackupResult result = backupExecutor.executeFullBackup(
                tenantId, schemaName, tenantName
            );
            
            // 更新备份记录
            TenantBackup backup = backupRepository.findById(backupId)
                .orElseThrow(() -> new IllegalStateException("备份记录不存在"));
            
            if (result.isSuccess()) {
                // 创建元数据
                TenantBackup.BackupMetadata metadata = new TenantBackup.BackupMetadata(
                    result.getMetadata().getTenantName(),
                    result.getMetadata().getSchemaName(),
                    result.getMetadata().getTableCount(),
                    result.getMetadata().getRecordCount(),
                    result.getMetadata().getDatabaseVersion(),
                    result.getMetadata().getApplicationVersion()
                );
                
                backup = TenantBackup.builder()
                    .from(backup)
                    .status(TenantBackup.BackupStatus.COMPLETED)
                    .backupPath(result.getBackupPath())
                    .backupSize(result.getBackupSize())
                    .checksum(result.getChecksum())
                    .completedAt(Instant.now())
                    .metadata(metadata)
                    .build();
                
                // 更新进度
                progress.setStatus("COMPLETED");
                progress.setProgressPercentage(100);
                progress.setCurrentStep("备份完成");
            } else {
                backup = backup.markFailed(result.getErrorMessage());
                
                progress.setStatus("FAILED");
                progress.setCurrentStep("备份失败: " + result.getErrorMessage());
            }
            
            backupRepository.save(backup);
            
        } catch (Exception e) {
            logger.error("备份执行失败", e);
            
            TenantBackup backup = backupRepository.findById(backupId)
                .orElseThrow(() -> new IllegalStateException("备份记录不存在"));
            backup = backup.markFailed(e.getMessage());
            backupRepository.save(backup);
            
            BackupProgress progress = backupProgressMap.get(backupId);
            if (progress != null) {
                progress.setStatus("FAILED");
                progress.setCurrentStep("备份失败: " + e.getMessage());
            }
        }
    }
    
    @Override
    public UUID createIncrementalBackup(TenantId tenantId, UUID sinceBackupId) {
        // 增量备份暂不实现，返回全量备份
        logger.warn("增量备份暂未实现，将执行全量备份");
        return createFullBackup(tenantId);
    }
    
    @Override
    @Transactional
    public UUID restoreFromBackup(UUID backupId, TenantId targetTenantId, boolean overwrite) {
        logger.info("从备份 {} 恢复数据到租户 {}, 覆盖模式: {}", 
            backupId, targetTenantId != null ? targetTenantId.getValue() : "原租户", overwrite);
        
        // 1. 获取备份信息
        TenantBackup backup = backupRepository.findById(backupId)
            .orElseThrow(() -> new IllegalArgumentException("备份不存在: " + backupId));
        
        if (!backup.isRestorable()) {
            throw new IllegalStateException("备份不可用于恢复");
        }
        
        // 2. 确定目标租户
        TenantId actualTargetTenantId = targetTenantId != null ? targetTenantId : backup.getTenantId();
        
        Tenant targetTenant = tenantRepository.findById(actualTargetTenantId)
            .orElseThrow(() -> new IllegalArgumentException("目标租户不存在"));
        
        // 3. 生成恢复任务ID
        UUID restoreTaskId = UUID.randomUUID();
        
        // 4. 异步执行恢复
        executeRestoreAsync(restoreTaskId, backup, targetTenant.getSchemaName(), overwrite);
        
        return restoreTaskId;
    }
    
    @Async
    protected void executeRestoreAsync(UUID restoreTaskId, TenantBackup backup, 
                                      String targetSchemaName, boolean overwrite) {
        try {
            // 初始化进度
            RestoreProgress progress = new RestoreProgress();
            progress.setRestoreTaskId(restoreTaskId);
            progress.setBackupId(backup.getId());
            progress.setStatus("IN_PROGRESS");
            progress.setProgressPercentage(0);
            progress.setCurrentStep("开始恢复");
            progress.setStartedAt(Instant.now());
            restoreProgressMap.put(restoreTaskId, progress);
            
            // 执行恢复
            TenantRestoreExecutor.RestoreResult result = restoreExecutor.executeRestore(
                backup.getBackupPath(), targetSchemaName, overwrite
            );
            
            if (result.isSuccess()) {
                progress.setStatus("COMPLETED");
                progress.setProgressPercentage(100);
                progress.setCurrentStep("恢复完成");
            } else {
                progress.setStatus("FAILED");
                progress.setCurrentStep("恢复失败");
                progress.setErrorMessage(result.getErrorMessage());
            }
            
        } catch (Exception e) {
            logger.error("恢复执行失败", e);
            
            RestoreProgress progress = restoreProgressMap.get(restoreTaskId);
            if (progress != null) {
                progress.setStatus("FAILED");
                progress.setCurrentStep("恢复失败");
                progress.setErrorMessage(e.getMessage());
            }
        }
    }
    
    @Override
    public TenantBackupDTO getBackupDetails(UUID backupId) {
        TenantBackup backup = backupRepository.findById(backupId)
            .orElseThrow(() -> new IllegalArgumentException("备份不存在: " + backupId));
        
        return toDTO(backup);
    }
    
    @Override
    public List<TenantBackupDTO> getTenantBackups(TenantId tenantId) {
        return backupRepository.findByTenantId(tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public TenantBackupDTO getLatestBackup(TenantId tenantId) {
        return backupRepository.findLatestByTenantId(tenantId)
            .map(this::toDTO)
            .orElse(null);
    }
    
    @Override
    @Transactional
    public void deleteBackup(UUID backupId) {
        TenantBackup backup = backupRepository.findById(backupId)
            .orElseThrow(() -> new IllegalArgumentException("备份不存在: " + backupId));
        
        // 删除备份文件
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(backup.getBackupPath()));
        } catch (Exception e) {
            logger.warn("删除备份文件失败: {}", backup.getBackupPath(), e);
        }
        
        // 删除备份记录
        backupRepository.delete(backupId);
    }
    
    @Override
    @Transactional
    public int cleanupExpiredBackups(int retentionDays) {
        Instant expirationDate = Instant.now().minus(Duration.ofDays(retentionDays));
        List<TenantBackup> expiredBackups = backupRepository.findExpiredBackups(expirationDate);
        
        int count = 0;
        for (TenantBackup backup : expiredBackups) {
            try {
                deleteBackup(backup.getId());
                count++;
            } catch (Exception e) {
                logger.error("清理过期备份失败: {}", backup.getId(), e);
            }
        }
        
        logger.info("清理了 {} 个过期备份", count);
        return count;
    }
    
    @Override
    public BackupValidationResult validateBackup(UUID backupId) {
        TenantBackup backup = backupRepository.findById(backupId)
            .orElseThrow(() -> new IllegalArgumentException("备份不存在: " + backupId));
        
        BackupValidationResult result = new BackupValidationResult();
        BackupValidationResult.ValidationDetails details = new BackupValidationResult.ValidationDetails();
        
        // 验证备份文件
        TenantRestoreExecutor.ValidationResult validationResult = 
            restoreExecutor.validateBackupFile(backup.getBackupPath(), backup.getChecksum());
        
        if (validationResult.isValid()) {
            result.setValid(true);
            details.setChecksumValid(true);
            details.setFileExists(true);
            details.setFileReadable(true);
        } else {
            result.setValid(false);
            result.addError(validationResult.getMessage());
        }
        
        details.setExpectedChecksum(backup.getChecksum());
        result.setDetails(details);
        
        return result;
    }
    
    @Override
    public BackupProgress getBackupProgress(UUID backupId) {
        return backupProgressMap.get(backupId);
    }
    
    @Override
    public RestoreProgress getRestoreProgress(UUID restoreTaskId) {
        return restoreProgressMap.get(restoreTaskId);
    }
    
    // 辅助方法：转换为DTO
    private TenantBackupDTO toDTO(TenantBackup backup) {
        TenantBackupDTO dto = new TenantBackupDTO();
        dto.setId(backup.getId());
        dto.setTenantId(backup.getTenantId().getValue());
        dto.setBackupType(backup.getType().name());
        dto.setStatus(backup.getStatus().name());
        dto.setBackupPath(backup.getBackupPath());
        dto.setBackupSize(backup.getBackupSize());
        dto.setBackupSizeFormatted(formatFileSize(backup.getBackupSize()));
        dto.setChecksum(backup.getChecksum());
        dto.setStartedAt(backup.getStartedAt());
        dto.setCompletedAt(backup.getCompletedAt());
        
        if (backup.getStartedAt() != null && backup.getCompletedAt() != null) {
            dto.setDurationSeconds(Duration.between(backup.getStartedAt(), backup.getCompletedAt()).getSeconds());
        }
        
        dto.setErrorMessage(backup.getErrorMessage());
        
        if (backup.getMetadata() != null) {
            TenantBackupDTO.BackupMetadataDTO metadataDTO = new TenantBackupDTO.BackupMetadataDTO();
            metadataDTO.setTenantName(backup.getMetadata().getTenantName());
            metadataDTO.setSchemaName(backup.getMetadata().getSchemaName());
            metadataDTO.setTableCount(backup.getMetadata().getTableCount());
            metadataDTO.setRecordCount(backup.getMetadata().getRecordCount());
            metadataDTO.setDatabaseVersion(backup.getMetadata().getDatabaseVersion());
            metadataDTO.setApplicationVersion(backup.getMetadata().getApplicationVersion());
            dto.setMetadata(metadataDTO);
            dto.setTenantName(backup.getMetadata().getTenantName());
        }
        
        return dto;
    }
    
    private String formatFileSize(Long bytes) {
        if (bytes == null) return null;
        
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.2f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}

