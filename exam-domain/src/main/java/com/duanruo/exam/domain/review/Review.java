package com.duanruo.exam.domain.review;

import com.duanruo.exam.domain.application.ApplicationId;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 审核记录领域模型
 * 
 * 不可变的审核历史记录，用于审计追踪
 * 与 ReviewTask 的区别：
 * - ReviewTask: 可变的工作流管理（任务分配、锁定、心跳）
 * - Review: 不可变的审核决定记录（审核结果、评论、时间戳）
 */
public class Review {
    
    private final UUID id;
    private final ApplicationId applicationId;
    private final ReviewStage stage;
    private final UUID reviewerId;
    private final ReviewDecision decision;
    private final String comment;
    private final LocalDateTime reviewedAt;
    private final LocalDateTime createdAt;

    private Review(UUID id, ApplicationId applicationId, ReviewStage stage, 
                   UUID reviewerId, ReviewDecision decision, String comment,
                   LocalDateTime reviewedAt, LocalDateTime createdAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.stage = stage;
        this.reviewerId = reviewerId;
        this.decision = decision;
        this.comment = comment;
        this.reviewedAt = reviewedAt;
        this.createdAt = createdAt;
    }

    /**
     * 创建新的审核记录（审核通过）
     */
    public static Review approve(ApplicationId applicationId, ReviewStage stage, 
                                 UUID reviewerId, String comment) {
        return new Review(
            UUID.randomUUID(),
            applicationId,
            stage,
            reviewerId,
            ReviewDecision.APPROVED,
            comment,
            LocalDateTime.now(),
            LocalDateTime.now()
        );
    }

    /**
     * 创建新的审核记录（审核拒绝）
     */
    public static Review reject(ApplicationId applicationId, ReviewStage stage, 
                                UUID reviewerId, String comment) {
        return new Review(
            UUID.randomUUID(),
            applicationId,
            stage,
            reviewerId,
            ReviewDecision.REJECTED,
            comment,
            LocalDateTime.now(),
            LocalDateTime.now()
        );
    }

    /**
     * 创建新的审核记录（退回修改）
     */
    public static Review returnForRevision(ApplicationId applicationId, ReviewStage stage, 
                                          UUID reviewerId, String comment) {
        return new Review(
            UUID.randomUUID(),
            applicationId,
            stage,
            reviewerId,
            ReviewDecision.RETURNED,
            comment,
            LocalDateTime.now(),
            LocalDateTime.now()
        );
    }

    /**
     * 从持久化数据重建审核记录
     */
    public static Review rebuild(UUID id, ApplicationId applicationId, ReviewStage stage,
                                 UUID reviewerId, ReviewDecision decision, String comment,
                                 LocalDateTime reviewedAt, LocalDateTime createdAt) {
        return new Review(id, applicationId, stage, reviewerId, decision, comment, 
                         reviewedAt, createdAt);
    }

    /**
     * 判断是否已完成审核
     */
    public boolean isCompleted() {
        return reviewedAt != null && decision != null;
    }

    /**
     * 判断是否通过
     */
    public boolean isApproved() {
        return decision == ReviewDecision.APPROVED;
    }

    /**
     * 判断是否拒绝
     */
    public boolean isRejected() {
        return decision == ReviewDecision.REJECTED;
    }

    /**
     * 判断是否退回
     */
    public boolean isReturned() {
        return decision == ReviewDecision.RETURNED;
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public ApplicationId getApplicationId() {
        return applicationId;
    }

    public ReviewStage getStage() {
        return stage;
    }

    public UUID getReviewerId() {
        return reviewerId;
    }

    public ReviewDecision getDecision() {
        return decision;
    }

    public String getComment() {
        return comment;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @Override
    public String toString() {
        return "Review{" +
                "id=" + id +
                ", applicationId=" + applicationId +
                ", stage=" + stage +
                ", reviewerId=" + reviewerId +
                ", decision=" + decision +
                ", reviewedAt=" + reviewedAt +
                '}';
    }
}

