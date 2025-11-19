package com.duanruo.exam.infrastructure.persistence.entity;

import com.duanruo.exam.domain.application.ApplicationStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 报名申请审计日志实体
 */
@Entity
@Table(name = "application_audit_logs")
public class ApplicationAuditLogEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 50)
    private ApplicationStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 50, nullable = false)
    private ApplicationStatus toStatus;

    @Column(name = "actor", length = 100)
    private String actor;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "JSONB")
    private JsonNode metadata;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }
    public ApplicationStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(ApplicationStatus fromStatus) { this.fromStatus = fromStatus; }
    public ApplicationStatus getToStatus() { return toStatus; }
    public void setToStatus(ApplicationStatus toStatus) { this.toStatus = toStatus; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public JsonNode getMetadata() { return metadata; }
    public void setMetadata(JsonNode metadata) { this.metadata = metadata; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

