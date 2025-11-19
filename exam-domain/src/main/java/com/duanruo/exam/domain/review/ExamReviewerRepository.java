package com.duanruo.exam.domain.review;

import java.util.List;
import java.util.UUID;

/**
 * 考试-审核员关联仓储
 */
public interface ExamReviewerRepository {
    void add(UUID examId, UUID reviewerId, ReviewStage stage);
    void remove(UUID examId, UUID reviewerId, ReviewStage stage);
    boolean exists(UUID examId, UUID reviewerId, ReviewStage stage);
    List<UUID> findExamIdsByReviewer(UUID reviewerId);
    List<UUID> findReviewerIdsByExam(UUID examId, ReviewStage stage);

    /**
     * 获取考试的所有审核员（包括详细信息）
     */
    List<ExamReviewerInfo> findReviewerInfosByExam(UUID examId);

    /**
     * 审核员信息
     */
    record ExamReviewerInfo(
        Long id,
        UUID reviewerId,
        ReviewStage stage,
        java.time.LocalDateTime createdAt
    ) {}
}

