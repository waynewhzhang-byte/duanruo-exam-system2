package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * 租户备份实体
 */
@Entity
@Table(name = "tenant_backups", schema = "public")
public class TenantBackupEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "backup_type", nullable = false, length = 20)
    private String backupType;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status;
    
    @Column(name = "backup_path", length = 500)
    private String backupPath;
    
    @Column(name = "backup_size")
    private Long backupSize;
    
    @Column(name = "checksum", length = 64)
    private String checksum;
    
    @Column(name = "started_at", nullable = false)
    private Instant startedAt;
    
    @Column(name = "completed_at")
    private Instant completedAt;
    
    @Column(name = "error_message", length = 1000)
    private String errorMessage;
    
    // 元数据字段
    @Column(name = "tenant_name", length = 100)
    private String tenantName;
    
    @Column(name = "schema_name", length = 63)
    private String schemaName;
    
    @Column(name = "table_count")
    private Integer tableCount;
    
    @Column(name = "record_count")
    private Long recordCount;
    
    @Column(name = "database_version", length = 50)
    private String databaseVersion;
    
    @Column(name = "application_version", length = 50)
    private String applicationVersion;
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    
    public String getBackupType() { return backupType; }
    public void setBackupType(String backupType) { this.backupType = backupType; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getBackupPath() { return backupPath; }
    public void setBackupPath(String backupPath) { this.backupPath = backupPath; }
    
    public Long getBackupSize() { return backupSize; }
    public void setBackupSize(Long backupSize) { this.backupSize = backupSize; }
    
    public String getChecksum() { return checksum; }
    public void setChecksum(String checksum) { this.checksum = checksum; }
    
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
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
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

