package com.duanruo.exam.application.tenant;

import java.time.Instant;
import java.util.UUID;

/**
 * 租户备份DTO
 */
public class TenantBackupDTO {
    
    private UUID id;
    private UUID tenantId;
    private String tenantName;
    private String backupType;
    private String status;
    private String backupPath;
    private Long backupSize;
    private String backupSizeFormatted;
    private String checksum;
    private Instant startedAt;
    private Instant completedAt;
    private Long durationSeconds;
    private String errorMessage;
    private BackupMetadataDTO metadata;
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    
    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }
    
    public String getBackupType() { return backupType; }
    public void setBackupType(String backupType) { this.backupType = backupType; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getBackupPath() { return backupPath; }
    public void setBackupPath(String backupPath) { this.backupPath = backupPath; }
    
    public Long getBackupSize() { return backupSize; }
    public void setBackupSize(Long backupSize) { this.backupSize = backupSize; }
    
    public String getBackupSizeFormatted() { return backupSizeFormatted; }
    public void setBackupSizeFormatted(String backupSizeFormatted) { 
        this.backupSizeFormatted = backupSizeFormatted; 
    }
    
    public String getChecksum() { return checksum; }
    public void setChecksum(String checksum) { this.checksum = checksum; }
    
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    
    public Long getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Long durationSeconds) { this.durationSeconds = durationSeconds; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public BackupMetadataDTO getMetadata() { return metadata; }
    public void setMetadata(BackupMetadataDTO metadata) { this.metadata = metadata; }
    
    public static class BackupMetadataDTO {
        private String tenantName;
        private String schemaName;
        private Integer tableCount;
        private Long recordCount;
        private String databaseVersion;
        private String applicationVersion;
        
        public String getTenantName() { return tenantName; }
        public void setTenantName(String tenantName) { this.tenantName = tenantName; }
        
        public String getSchemaName() { return schemaName; }
        public void setSchemaName(String schemaName) { this.schemaName = schemaName; }
        
        public Integer getTableCount() { return tableCount; }
        public void setTableCount(Integer tableCount) { this.tableCount = tableCount; }
        
        public Long getRecordCount() { return recordCount; }
        public void setRecordCount(Long recordCount) { this.recordCount = recordCount; }
        
        public String getDatabaseVersion() { return databaseVersion; }
        public void setDatabaseVersion(String databaseVersion) { 
            this.databaseVersion = databaseVersion; 
        }
        
        public String getApplicationVersion() { return applicationVersion; }
        public void setApplicationVersion(String applicationVersion) { 
            this.applicationVersion = applicationVersion; 
        }
    }
}

