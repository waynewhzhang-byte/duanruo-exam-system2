package com.duanruo.exam.domain.tenant;

/**
 * 租户恢复执行器接口
 * 定义恢复操作的契约
 */
public interface TenantRestoreExecutor {
    
    /**
     * 执行恢复操作
     * 
     * @param backupFilePath 备份文件路径
     * @param targetSchemaName 目标Schema名称
     * @param overwrite 是否覆盖现有数据
     * @return 恢复结果
     */
    RestoreResult executeRestore(String backupFilePath, String targetSchemaName, boolean overwrite);
    
    /**
     * 验证备份文件完整性
     * 
     * @param backupFilePath 备份文件路径
     * @param expectedChecksum 期望的校验和
     * @return 验证结果
     */
    ValidationResult validateBackupFile(String backupFilePath, String expectedChecksum);
    
    /**
     * 恢复结果
     */
    class RestoreResult {
        private final boolean success;
        private final int executedStatements;
        private final long durationMs;
        private final String errorMessage;
        
        public RestoreResult(boolean success, int executedStatements, long durationMs, String errorMessage) {
            this.success = success;
            this.executedStatements = executedStatements;
            this.durationMs = durationMs;
            this.errorMessage = errorMessage;
        }
        
        public boolean isSuccess() { return success; }
        public int getExecutedStatements() { return executedStatements; }
        public long getDurationMs() { return durationMs; }
        public String getErrorMessage() { return errorMessage; }
    }
    
    /**
     * 验证结果
     */
    class ValidationResult {
        private final boolean valid;
        private final String message;
        
        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }
        
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
    }
}

