package com.duanruo.exam.domain.tenant;

import com.duanruo.exam.shared.domain.TenantId;

/**
 * 租户备份执行器接口
 * 定义备份操作的契约
 */
public interface TenantBackupExecutor {
    
    /**
     * 执行全量备份
     * 
     * @param tenantId 租户ID
     * @param schemaName Schema名称
     * @param tenantName 租户名称
     * @return 备份结果
     */
    BackupResult executeFullBackup(TenantId tenantId, String schemaName, String tenantName);
    
    /**
     * 备份结果
     */
    class BackupResult {
        private final boolean success;
        private final String backupPath;
        private final Long backupSize;
        private final String checksum;
        private final BackupMetadata metadata;
        private final String errorMessage;
        
        public BackupResult(boolean success, String backupPath, Long backupSize,
                          String checksum, BackupMetadata metadata, String errorMessage) {
            this.success = success;
            this.backupPath = backupPath;
            this.backupSize = backupSize;
            this.checksum = checksum;
            this.metadata = metadata;
            this.errorMessage = errorMessage;
        }
        
        public boolean isSuccess() { return success; }
        public String getBackupPath() { return backupPath; }
        public Long getBackupSize() { return backupSize; }
        public String getChecksum() { return checksum; }
        public BackupMetadata getMetadata() { return metadata; }
        public String getErrorMessage() { return errorMessage; }
    }
    
    /**
     * 备份元数据
     */
    class BackupMetadata {
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

