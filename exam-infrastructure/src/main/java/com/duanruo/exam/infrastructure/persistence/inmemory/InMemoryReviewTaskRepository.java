package com.duanruo.exam.infrastructure.persistence.inmemory;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.review.ReviewStage;
import com.duanruo.exam.domain.review.ReviewTask;
import com.duanruo.exam.domain.review.ReviewTaskRepository;
import com.duanruo.exam.domain.review.ReviewTaskStatus;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryReviewTaskRepository implements ReviewTaskRepository {

    private final Map<UUID, ReviewTask> store = new ConcurrentHashMap<>();

    @Override
    public void save(ReviewTask task) {
        store.put(task.getId(), task);
    }

    @Override
    public Optional<ReviewTask> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<ReviewTask> findActiveByApplicationAndStage(ApplicationId applicationId, ReviewStage stage) {
        Duration ttl = Duration.ofMinutes(10);
        return store.values().stream()
                .filter(t -> t.getApplicationId().equals(applicationId) && t.getStage() == stage)
                .filter(t -> t.getStatus() != ReviewTaskStatus.COMPLETED && t.getStatus() != ReviewTaskStatus.CANCELLED)
                .filter(t -> !t.isLockExpired(ttl))
                .findFirst();
    }

    @Override
    public List<ReviewTask> findAssignedTo(UUID reviewerId) {
        return store.values().stream()
                .filter(t -> Objects.equals(t.getAssignedTo(), reviewerId) && t.getStatus() == ReviewTaskStatus.ASSIGNED)
                .toList();
    }

    @Override
    public List<ReviewTask> findOpenByExamIds(List<UUID> examIds, ReviewStage stage) {
        // In-memory implementation cannot map application->exam; return empty to avoid overexposure
        return List.of();
    }

    @Override
    public List<ReviewTask> findOpenAll(ReviewStage stage) {
        return store.values().stream()
                .filter(t -> t.getStatus() == ReviewTaskStatus.OPEN)
                .filter(t -> stage == null || t.getStage() == stage)
                .toList();
    }

    @Override
    public List<ReviewTask> findAssignedAll() {
        return store.values().stream()
                .filter(t -> t.getStatus() == ReviewTaskStatus.ASSIGNED)
                .toList();
    }

}

