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
 * 申请JPA实体
 */
@Entity
@Table(name = "applications", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"exam_id", "candidate_id"}))
public class ApplicationEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "exam_id", nullable = false)
    private UUID examId;
    
    @Column(name = "position_id", nullable = false)
    private UUID positionId;
    
    @Column(name = "candidate_id", nullable = false)
    private UUID candidateId;
    
    @Column(name = "form_version")
    private Integer formVersion = 1;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "JSONB")
    private JsonNode payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private ApplicationStatusEntity status = ApplicationStatusEntity.DRAFT;

    @Transient
    private JsonNode autoCheckResult;

    @Transient
    private JsonNode finalDecision;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Transient
    private LocalDateTime statusUpdatedAt;

    @Transient
    private Long version = 0L;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public ApplicationEntity() {}
    
    public ApplicationEntity(UUID id, UUID examId, UUID positionId, UUID candidateId) {
        this.id = id;
        this.examId = examId;
        this.positionId = positionId;
        this.candidateId = candidateId;
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }
    
    public UUID getPositionId() { return positionId; }
    public void setPositionId(UUID positionId) { this.positionId = positionId; }
    
    public UUID getCandidateId() { return candidateId; }
    public void setCandidateId(UUID candidateId) { this.candidateId = candidateId; }
    
    public Integer getFormVersion() { return formVersion; }
    public void setFormVersion(Integer formVersion) { this.formVersion = formVersion; }
    
    public JsonNode getPayload() { return payload; }
    public void setPayload(JsonNode payload) { this.payload = payload; }

    public ApplicationStatusEntity getStatus() { return status; }
    public void setStatus(ApplicationStatusEntity status) { this.status = status; }
    
    public JsonNode getAutoCheckResult() { return autoCheckResult; }
    public void setAutoCheckResult(JsonNode autoCheckResult) { this.autoCheckResult = autoCheckResult; }

    public JsonNode getFinalDecision() { return finalDecision; }
    public void setFinalDecision(JsonNode finalDecision) { this.finalDecision = finalDecision; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    
    public LocalDateTime getStatusUpdatedAt() { return statusUpdatedAt; }
    public void setStatusUpdatedAt(LocalDateTime statusUpdatedAt) { this.statusUpdatedAt = statusUpdatedAt; }
    
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public enum ApplicationStatusEntity {
        DRAFT, SUBMITTED, AUTO_REJECTED, AUTO_PASSED, PENDING_PRIMARY_REVIEW,
        PRIMARY_REJECTED, PRIMARY_PASSED, PENDING_SECONDARY_REVIEW,
        SECONDARY_REJECTED, APPROVED, PAID, TICKET_ISSUED,
        WRITTEN_EXAM_COMPLETED, WRITTEN_EXAM_FAILED, INTERVIEW_ELIGIBLE,
        INTERVIEW_COMPLETED, FINAL_ACCEPTED, FINAL_REJECTED,
        WITHDRAWN, EXPIRED
    }
}
