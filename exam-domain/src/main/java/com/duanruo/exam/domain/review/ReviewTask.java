package com.duanruo.exam.domain.review;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.shared.exception.DomainException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class ReviewTask {
    private UUID id;
    private ApplicationId applicationId;
    private ReviewStage stage;
    private ReviewTaskStatus status;
    private UUID assignedTo; // reviewer userId
    private LocalDateTime lockedAt;
    private LocalDateTime lastHeartbeatAt;
    private LocalDateTime createdAt;

    private ReviewTask() {}

    public static ReviewTask create(ApplicationId applicationId, ReviewStage stage) {
        ReviewTask t = new ReviewTask();
        t.id = UUID.randomUUID();
        t.applicationId = applicationId;
        t.stage = stage;
        t.status = ReviewTaskStatus.OPEN;
        t.createdAt = LocalDateTime.now();
        return t;
    }


    public static ReviewTask rebuild(UUID id, ApplicationId applicationId, ReviewStage stage,
                                     ReviewTaskStatus status, UUID assignedTo,
                                     LocalDateTime lockedAt, LocalDateTime lastHeartbeatAt,
                                     LocalDateTime createdAt) {
        ReviewTask t = new ReviewTask();
        t.id = id;
        t.applicationId = applicationId;
        t.stage = stage;
        t.status = status;
        t.assignedTo = assignedTo;
        t.lockedAt = lockedAt;
        t.lastHeartbeatAt = lastHeartbeatAt;
        t.createdAt = createdAt;
        return t;
    }

    public void assign(UUID reviewerId) {
        if (status == ReviewTaskStatus.COMPLETED || status == ReviewTaskStatus.CANCELLED) {
            throw new TaskException("CANNOT_ASSIGN_TERMINAL", "任务已结束，无法分配");
        }
        this.assignedTo = reviewerId;
        this.status = ReviewTaskStatus.ASSIGNED;
        this.lockedAt = LocalDateTime.now();
        this.lastHeartbeatAt = this.lockedAt;
    }

    public void heartbeat(UUID reviewerId) {
        if (!Objects.equals(this.assignedTo, reviewerId)) {
            throw new TaskException("NOT_ASSIGNEE", "非任务领取人");
        }
        if (status != ReviewTaskStatus.ASSIGNED) {
            throw new TaskException("NOT_ASSIGNED", "任务未处于领取状态");
        }
        this.lastHeartbeatAt = LocalDateTime.now();
    }

    public void release(UUID reviewerId) {
        if (!Objects.equals(this.assignedTo, reviewerId)) {
            throw new TaskException("NOT_ASSIGNEE", "非任务领取人");
        }
        if (status != ReviewTaskStatus.ASSIGNED) {
            throw new TaskException("NOT_ASSIGNED", "任务未处于领取状态");
        }
        this.assignedTo = null;
        this.status = ReviewTaskStatus.OPEN;
        this.lockedAt = null;
        this.lastHeartbeatAt = null;
    }

    public void complete(UUID reviewerId) {
        if (!Objects.equals(this.assignedTo, reviewerId)) {
            throw new TaskException("NOT_ASSIGNEE", "非任务领取人");
        }
        if (status != ReviewTaskStatus.ASSIGNED) {
            throw new TaskException("NOT_ASSIGNED", "任务未处于领取状态");
        }
        this.status = ReviewTaskStatus.COMPLETED;
    }

    public boolean isLockExpired(Duration ttl) {
        if (status != ReviewTaskStatus.ASSIGNED) return false;
        if (lockedAt == null) return true;
        return lockedAt.plus(ttl).isBefore(LocalDateTime.now());
    }

    public UUID getId() { return id; }
    public ApplicationId getApplicationId() { return applicationId; }
    public ReviewStage getStage() { return stage; }
    public ReviewTaskStatus getStatus() { return status; }
    public UUID getAssignedTo() { return assignedTo; }
    public LocalDateTime getLockedAt() { return lockedAt; }
    public LocalDateTime getLastHeartbeatAt() { return lastHeartbeatAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public static class TaskException extends DomainException {
        public TaskException(String errorCode, String message) { super(errorCode, message); }
    }
}

