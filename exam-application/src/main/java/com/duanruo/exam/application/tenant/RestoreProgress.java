package com.duanruo.exam.application.tenant;

import java.time.Instant;
import java.util.UUID;

/**
 * 恢复进度
 */
public class RestoreProgress {
    
    private UUID restoreTaskId;
    private UUID backupId;
    private UUID targetTenantId;
    private String status;
    private int progressPercentage;
    private String currentStep;
    private Integer totalTables;
    private Integer restoredTables;
    private Long totalRecords;
    private Long restoredRecords;
    private Instant startedAt;
    private Long estimatedTimeRemainingSeconds;
    private String errorMessage;
    
    public UUID getRestoreTaskId() { return restoreTaskId; }
    public void setRestoreTaskId(UUID restoreTaskId) { this.restoreTaskId = restoreTaskId; }
    
    public UUID getBackupId() { return backupId; }
    public void setBackupId(UUID backupId) { this.backupId = backupId; }
    
    public UUID getTargetTenantId() { return targetTenantId; }
    public void setTargetTenantId(UUID targetTenantId) { this.targetTenantId = targetTenantId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public int getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(int progressPercentage) { 
        this.progressPercentage = progressPercentage; 
    }
    
    public String getCurrentStep() { return currentStep; }
    public void setCurrentStep(String currentStep) { this.currentStep = currentStep; }
    
    public Integer getTotalTables() { return totalTables; }
    public void setTotalTables(Integer totalTables) { this.totalTables = totalTables; }
    
    public Integer getRestoredTables() { return restoredTables; }
    public void setRestoredTables(Integer restoredTables) { 
        this.restoredTables = restoredTables; 
    }
    
    public Long getTotalRecords() { return totalRecords; }
    public void setTotalRecords(Long totalRecords) { this.totalRecords = totalRecords; }
    
    public Long getRestoredRecords() { return restoredRecords; }
    public void setRestoredRecords(Long restoredRecords) { 
        this.restoredRecords = restoredRecords; 
    }
    
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    
    public Long getEstimatedTimeRemainingSeconds() { return estimatedTimeRemainingSeconds; }
    public void setEstimatedTimeRemainingSeconds(Long estimatedTimeRemainingSeconds) { 
        this.estimatedTimeRemainingSeconds = estimatedTimeRemainingSeconds; 
    }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

