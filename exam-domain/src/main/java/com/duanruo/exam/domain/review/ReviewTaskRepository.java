package com.duanruo.exam.domain.review;

import com.duanruo.exam.domain.application.ApplicationId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewTaskRepository {
    void save(ReviewTask task);
    Optional<ReviewTask> findById(UUID id);
    Optional<ReviewTask> findActiveByApplicationAndStage(ApplicationId applicationId, ReviewStage stage);
    List<ReviewTask> findAssignedTo(UUID reviewerId);

    // For queues
    List<ReviewTask> findOpenByExamIds(List<UUID> examIds, ReviewStage stage);
    List<ReviewTask> findOpenAll(ReviewStage stage);
    List<ReviewTask> findAssignedAll();
}

