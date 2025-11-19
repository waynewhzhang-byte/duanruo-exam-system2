package com.duanruo.exam.application.tenant;

import java.time.Instant;
import java.util.UUID;

/**
 * 备份进度
 */
public class BackupProgress {
    
    private UUID backupId;
    private String status;
    private int progressPercentage;
    private String currentStep;
    private Integer totalTables;
    private Integer completedTables;
    private Long totalRecords;
    private Long processedRecords;
    private Long bytesProcessed;
    private Instant startedAt;
    private Long estimatedTimeRemainingSeconds;
    
    public UUID getBackupId() { return backupId; }
    public void setBackupId(UUID backupId) { this.backupId = backupId; }
    
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
    
    public Integer getCompletedTables() { return completedTables; }
    public void setCompletedTables(Integer completedTables) { 
        this.completedTables = completedTables; 
    }
    
    public Long getTotalRecords() { return totalRecords; }
    public void setTotalRecords(Long totalRecords) { this.totalRecords = totalRecords; }
    
    public Long getProcessedRecords() { return processedRecords; }
    public void setProcessedRecords(Long processedRecords) { 
        this.processedRecords = processedRecords; 
    }
    
    public Long getBytesProcessed() { return bytesProcessed; }
    public void setBytesProcessed(Long bytesProcessed) { this.bytesProcessed = bytesProcessed; }
    
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    
    public Long getEstimatedTimeRemainingSeconds() { return estimatedTimeRemainingSeconds; }
    public void setEstimatedTimeRemainingSeconds(Long estimatedTimeRemainingSeconds) { 
        this.estimatedTimeRemainingSeconds = estimatedTimeRemainingSeconds; 
    }
}

