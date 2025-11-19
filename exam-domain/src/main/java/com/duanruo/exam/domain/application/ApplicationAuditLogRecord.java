package com.duanruo.exam.domain.application;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 领域层的审计日志记录模型
 */
public class ApplicationAuditLogRecord {
    private final UUID id;
    private final ApplicationId applicationId;
    private final ApplicationStatus from;
    private final ApplicationStatus to;
    private final String actor;
    private final String reason;
    private final String metadata;
    private final LocalDateTime createdAt;

    public ApplicationAuditLogRecord(UUID id, ApplicationId applicationId, ApplicationStatus from,
                                     ApplicationStatus to, String actor, String reason,
                                     String metadata, LocalDateTime createdAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.from = from;
        this.to = to;
        this.actor = actor;
        this.reason = reason;
        this.metadata = metadata;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public ApplicationId getApplicationId() { return applicationId; }
    public ApplicationStatus getFrom() { return from; }
    public ApplicationStatus getTo() { return to; }
    public String getActor() { return actor; }
    public String getReason() { return reason; }
    public String getMetadata() { return metadata; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

