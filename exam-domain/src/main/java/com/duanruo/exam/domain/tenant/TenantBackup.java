package com.duanruo.exam.domain.tenant;

import com.duanruo.exam.shared.domain.TenantId;

import java.time.Instant;
import java.util.UUID;

/**
 * 租户备份领域模型
 * 表示一次租户数据备份的完整信息
 */
public class TenantBackup {
    
    private final UUID id;
    private final TenantId tenantId;
    private final BackupType type;
    private final BackupStatus status;
    private final String backupPath;
    private final Long backupSize;
    private final String checksum;
    private final Instant startedAt;
    private final Instant completedAt;
    private final String errorMessage;
    private final BackupMetadata metadata;
    
    private TenantBackup(Builder builder) {
        this.id = builder.id;
        this.tenantId = builder.tenantId;
        this.type = builder.type;
        this.status = builder.status;
        this.backupPath = builder.backupPath;
        this.backupSize = builder.backupSize;
        this.checksum = builder.checksum;
        this.startedAt = builder.startedAt;
        this.completedAt = builder.completedAt;
        this.errorMessage = builder.errorMessage;
        this.metadata = builder.metadata;
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    // Getters
    public UUID getId() { return id; }
    public TenantId getTenantId() { return tenantId; }
    public BackupType getType() { return type; }
    public BackupStatus getStatus() { return status; }
    public String getBackupPath() { return backupPath; }
    public Long getBackupSize() { return backupSize; }
    public String getChecksum() { return checksum; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public String getErrorMessage() { return errorMessage; }
    public BackupMetadata getMetadata() { return metadata; }
    
    /**
     * 标记备份完成
     */
    public TenantBackup markCompleted(String backupPath, Long backupSize, String checksum) {
        return builder()
            .from(this)
            .status(BackupStatus.COMPLETED)
            .backupPath(backupPath)
            .backupSize(backupSize)
            .checksum(checksum)
            .completedAt(Instant.now())
            .build();
    }
    
    /**
     * 标记备份失败
     */
    public TenantBackup markFailed(String errorMessage) {
        return builder()
            .from(this)
            .status(BackupStatus.FAILED)
            .errorMessage(errorMessage)
            .completedAt(Instant.now())
            .build();
    }
    
    /**
     * 检查备份是否可以用于恢复
     */
    public boolean isRestorable() {
        return status == BackupStatus.COMPLETED && backupPath != null && checksum != null;
    }
    
    public static class Builder {
        private UUID id;
        private TenantId tenantId;
        private BackupType type;
        private BackupStatus status;
        private String backupPath;
        private Long backupSize;
        private String checksum;
        private Instant startedAt;
        private Instant completedAt;
        private String errorMessage;
        private BackupMetadata metadata;
        
        public Builder id(UUID id) {
            this.id = id;
            return this;
        }
        
        public Builder tenantId(TenantId tenantId) {
            this.tenantId = tenantId;
            return this;
        }
        
        public Builder type(BackupType type) {
            this.type = type;
            return this;
        }
        
        public Builder status(BackupStatus status) {
            this.status = status;
            return this;
        }
        
        public Builder backupPath(String backupPath) {
            this.backupPath = backupPath;
            return this;
        }
        
        public Builder backupSize(Long backupSize) {
            this.backupSize = backupSize;
            return this;
        }
        
        public Builder checksum(String checksum) {
            this.checksum = checksum;
            return this;
        }
        
        public Builder startedAt(Instant startedAt) {
            this.startedAt = startedAt;
            return this;
        }
        
        public Builder completedAt(Instant completedAt) {
            this.completedAt = completedAt;
            return this;
        }
        
        public Builder errorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
            return this;
        }
        
        public Builder metadata(BackupMetadata metadata) {
            this.metadata = metadata;
            return this;
        }
        
        public Builder from(TenantBackup backup) {
            this.id = backup.id;
            this.tenantId = backup.tenantId;
            this.type = backup.type;
            this.status = backup.status;
            this.backupPath = backup.backupPath;
            this.backupSize = backup.backupSize;
            this.checksum = backup.checksum;
            this.startedAt = backup.startedAt;
            this.completedAt = backup.completedAt;
            this.errorMessage = backup.errorMessage;
            this.metadata = backup.metadata;
            return this;
        }
        
        public TenantBackup build() {
            if (id == null) {
                id = UUID.randomUUID();
            }
            if (startedAt == null) {
                startedAt = Instant.now();
            }
            if (status == null) {
                status = BackupStatus.IN_PROGRESS;
            }
            return new TenantBackup(this);
        }
    }
    
    /**
     * 备份类型
     */
    public enum BackupType {
        FULL,        // 全量备份
        INCREMENTAL, // 增量备份
        MANUAL       // 手动备份
    }
    
    /**
     * 备份状态
     */
    public enum BackupStatus {
        IN_PROGRESS, // 进行中
        COMPLETED,   // 已完成
        FAILED,      // 失败
        EXPIRED      // 已过期
    }
    
    /**
     * 备份元数据
     */
    public static class BackupMetadata {
        private final String tenantName;
        private final String schemaName;
        private final Integer tableCount;
        private final Long recordCount;
        private final String databaseVersion;
        private final String applicationVersion;
        
        public BackupMetadata(String tenantName, String schemaName, Integer tableCount, 
                            Long recordCount, String databaseVersion, String applicationVersion) {
            this.tenantName = tenantName;
            this.schemaName = schemaName;
            this.tableCount = tableCount;
            this.recordCount = recordCount;
            this.databaseVersion = databaseVersion;
            this.applicationVersion = applicationVersion;
        }
        
        public String getTenantName() { return tenantName; }
        public String getSchemaName() { return schemaName; }
        public Integer getTableCount() { return tableCount; }
        public Long getRecordCount() { return recordCount; }
        public String getDatabaseVersion() { return databaseVersion; }
        public String getApplicationVersion() { return applicationVersion; }
    }
}

