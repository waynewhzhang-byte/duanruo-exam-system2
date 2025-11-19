package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 考试成绩实体
 * 存储候选人各科目的考试成绩
 */
@Entity
@Table(name = "exam_scores",
        uniqueConstraints = @UniqueConstraint(name = "uq_application_subject", 
                                            columnNames = {"application_id", "subject_id"}),
        indexes = {
                @Index(name = "idx_exam_scores_application_id", columnList = "application_id"),
                @Index(name = "idx_exam_scores_subject_id", columnList = "subject_id"),
                @Index(name = "idx_exam_scores_graded_by", columnList = "graded_by"),
                @Index(name = "idx_exam_scores_graded_at", columnList = "graded_at"),
                @Index(name = "idx_exam_scores_score", columnList = "score")
        })
public class ExamScoreEntity {

    @Id
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;

    @Column(name = "score", nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "is_absent", nullable = false)
    private Boolean isAbsent = false;

    @Column(name = "graded_by")
    private UUID gradedBy;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 默认构造函数
    public ExamScoreEntity() {
        this.id = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isAbsent = false;
    }

    // 构造函数
    public ExamScoreEntity(UUID applicationId, UUID subjectId, BigDecimal score, 
                          Boolean isAbsent, UUID gradedBy, String remarks) {
        this();
        this.applicationId = applicationId;
        this.subjectId = subjectId;
        this.score = score;
        this.isAbsent = isAbsent;
        this.gradedBy = gradedBy;
        this.gradedAt = LocalDateTime.now();
        this.remarks = remarks;
    }

    // JPA生命周期回调
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // 业务方法
    public void updateScore(BigDecimal newScore, UUID gradedBy, String remarks) {
        this.score = newScore;
        this.gradedBy = gradedBy;
        this.gradedAt = LocalDateTime.now();
        this.remarks = remarks;
        this.isAbsent = false; // 有成绩就不是缺考
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsAbsent(UUID gradedBy, String remarks) {
        this.score = BigDecimal.ZERO;
        this.isAbsent = true;
        this.gradedBy = gradedBy;
        this.gradedAt = LocalDateTime.now();
        this.remarks = remarks;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }

    public UUID getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(UUID subjectId) {
        this.subjectId = subjectId;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public Boolean getIsAbsent() {
        return isAbsent;
    }

    public void setIsAbsent(Boolean isAbsent) {
        this.isAbsent = isAbsent;
    }

    public UUID getGradedBy() {
        return gradedBy;
    }

    public void setGradedBy(UUID gradedBy) {
        this.gradedBy = gradedBy;
    }

    public LocalDateTime getGradedAt() {
        return gradedAt;
    }

    public void setGradedAt(LocalDateTime gradedAt) {
        this.gradedAt = gradedAt;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ExamScoreEntity that)) return false;
        return applicationId.equals(that.applicationId) && subjectId.equals(that.subjectId);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(applicationId, subjectId);
    }

    @Override
    public String toString() {
        return "ExamScoreEntity{" +
                "id=" + id +
                ", applicationId=" + applicationId +
                ", subjectId=" + subjectId +
                ", score=" + score +
                ", isAbsent=" + isAbsent +
                ", gradedBy=" + gradedBy +
                ", gradedAt=" + gradedAt +
                ", remarks='" + remarks + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
