package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 审核记录JPA实体
 * 存储审核的历史记录
 * 
 * 注意：此表与 review_tasks 表功能不同
 * - reviews: 存储审核历史记录（不可变）
 * - review_tasks: 管理审核任务工作流（可变状态）
 */
@Entity
@Table(name = "reviews",
        indexes = {
                @Index(name = "idx_reviews_application_id", columnList = "application_id"),
                @Index(name = "idx_reviews_reviewer_id", columnList = "reviewer_id"),
                @Index(name = "idx_reviews_stage", columnList = "stage"),
                @Index(name = "idx_reviews_decision", columnList = "decision"),
                @Index(name = "idx_reviews_reviewed_at", columnList = "reviewed_at")
        })
public class ReviewEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "stage", nullable = false, length = 50)
    private String stage; // PRIMARY, SECONDARY

    @Column(name = "reviewer_id", nullable = false)
    private UUID reviewerId;

    @Column(name = "decision", length = 50)
    private String decision; // APPROVED, REJECTED, PENDING

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // 默认构造函数
    public ReviewEntity() {}

    // 构造函数
    public ReviewEntity(UUID id, UUID applicationId, String stage, UUID reviewerId) {
        this.id = id;
        this.applicationId = applicationId;
        this.stage = stage;
        this.reviewerId = reviewerId;
        this.createdAt = LocalDateTime.now();
    }

    // 业务方法
    public void approve(String comment) {
        this.decision = "APPROVED";
        this.comment = comment;
        this.reviewedAt = LocalDateTime.now();
    }

    public void reject(String comment) {
        this.decision = "REJECTED";
        this.comment = comment;
        this.reviewedAt = LocalDateTime.now();
    }

    public boolean isCompleted() {
        return reviewedAt != null && decision != null;
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

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public UUID getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(UUID reviewerId) {
        this.reviewerId = reviewerId;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "ReviewEntity{" +
                "id=" + id +
                ", applicationId=" + applicationId +
                ", stage='" + stage + '\'' +
                ", reviewerId=" + reviewerId +
                ", decision='" + decision + '\'' +
                ", reviewedAt=" + reviewedAt +
                ", createdAt=" + createdAt +
                '}';
    }
}

