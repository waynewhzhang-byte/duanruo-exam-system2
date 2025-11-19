package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 文件实体
 */
@Entity
@Table(name = "files")
public class FileEntity {

    @Id
    private UUID id;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "stored_name", nullable = false, unique = true)
    private String storedName;

    @Column(name = "object_key", nullable = false, unique = true)
    private String objectKey;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "field_key")
    private String fieldKey;

    @Column(name = "application_id")
    private UUID applicationId;

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private FileStatus status = FileStatus.UPLOADING;

    @Enumerated(EnumType.STRING)
    @Column(name = "virus_scan_status", length = 50)
    private VirusScanStatus virusScanStatus = VirusScanStatus.PENDING;

    @Column(name = "virus_scan_result")
    private String virusScanResult;

    @Column(name = "access_count")
    private Integer accessCount = 0;

    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "JSONB")
    private JsonNode metadata;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public FileEntity() {}

    public FileEntity(UUID id, String originalName, String storedName, String objectKey, 
                     String contentType, String uploadedBy) {
        this.id = id;
        this.originalName = originalName;
        this.storedName = storedName;
        this.objectKey = objectKey;
        this.contentType = contentType;
        this.uploadedBy = uploadedBy;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }

    public String getStoredName() { return storedName; }
    public void setStoredName(String storedName) { this.storedName = storedName; }

    public String getObjectKey() { return objectKey; }
    public void setObjectKey(String objectKey) { this.objectKey = objectKey; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public FileStatus getStatus() { return status; }
    public void setStatus(FileStatus status) { this.status = status; }

    public VirusScanStatus getVirusScanStatus() { return virusScanStatus; }
    public void setVirusScanStatus(VirusScanStatus virusScanStatus) { this.virusScanStatus = virusScanStatus; }

    public String getVirusScanResult() { return virusScanResult; }
    public void setVirusScanResult(String virusScanResult) { this.virusScanResult = virusScanResult; }

    public Integer getAccessCount() { return accessCount; }
    public void setAccessCount(Integer accessCount) { this.accessCount = accessCount; }

    public LocalDateTime getLastAccessedAt() { return lastAccessedAt; }
    public void setLastAccessedAt(LocalDateTime lastAccessedAt) { this.lastAccessedAt = lastAccessedAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public JsonNode getMetadata() { return metadata; }
    public void setMetadata(JsonNode metadata) { this.metadata = metadata; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    /**
     * 文件状态枚举
     */
    public enum FileStatus {
        UPLOADING,      // 上传中
        UPLOADED,       // 已上传
        AVAILABLE,      // 可用
        DELETED,        // 已删除
        EXPIRED,        // 已过期
        QUARANTINED     // 已隔离（病毒扫描失败）
    }

    /**
     * 病毒扫描状态枚举
     */
    public enum VirusScanStatus {
        PENDING,        // 待扫描
        SCANNING,       // 扫描中
        CLEAN,          // 干净
        INFECTED,       // 感染病毒
        FAILED,         // 扫描失败
        SKIPPED         // 跳过扫描
    }
}
