package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "review_tasks",
        indexes = {
                @Index(name = "idx_review_tasks_app_stage", columnList = "application_id,stage"),
                @Index(name = "idx_review_tasks_assigned_status", columnList = "assigned_to,status")
        })
public class ReviewTaskEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    public enum StageEntity { PRIMARY, SECONDARY }
    public enum StatusEntity { OPEN, ASSIGNED, COMPLETED, CANCELLED }

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false, length = 32)
    private StageEntity stage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private StatusEntity status;

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "last_heartbeat_at")
    private LocalDateTime lastHeartbeatAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected ReviewTaskEntity() {}

    public ReviewTaskEntity(UUID id, UUID applicationId, StageEntity stage, StatusEntity status) {
        this.id = id;
        this.applicationId = applicationId;
        this.stage = stage;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    // getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }
    public StageEntity getStage() { return stage; }
    public void setStage(StageEntity stage) { this.stage = stage; }
    public StatusEntity getStatus() { return status; }
    public void setStatus(StatusEntity status) { this.status = status; }
    public UUID getAssignedTo() { return assignedTo; }
    public void setAssignedTo(UUID assignedTo) { this.assignedTo = assignedTo; }
    public LocalDateTime getLockedAt() { return lockedAt; }
    public void setLockedAt(LocalDateTime lockedAt) { this.lockedAt = lockedAt; }
    public LocalDateTime getLastHeartbeatAt() { return lastHeartbeatAt; }
    public void setLastHeartbeatAt(LocalDateTime lastHeartbeatAt) { this.lastHeartbeatAt = lastHeartbeatAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

