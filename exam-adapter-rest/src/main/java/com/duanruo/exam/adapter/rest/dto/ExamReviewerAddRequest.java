package com.duanruo.exam.adapter.rest.dto;

import com.duanruo.exam.domain.review.ReviewStage;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * 请求体：为考试添加审核员关联
 */
public class ExamReviewerAddRequest {
    @NotNull
    private UUID reviewerId;

    @NotNull
    private ReviewStage stage;

    public UUID getReviewerId() { return reviewerId; }
    public void setReviewerId(UUID reviewerId) { this.reviewerId = reviewerId; }

    public ReviewStage getStage() { return stage; }
    public void setStage(ReviewStage stage) { this.stage = stage; }
}

