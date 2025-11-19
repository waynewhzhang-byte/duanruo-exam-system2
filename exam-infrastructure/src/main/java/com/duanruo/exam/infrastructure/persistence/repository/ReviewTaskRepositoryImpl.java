package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.review.ReviewStage;
import com.duanruo.exam.domain.review.ReviewTask;
import com.duanruo.exam.domain.review.ReviewTaskRepository;
import com.duanruo.exam.domain.review.ReviewTaskStatus;
import com.duanruo.exam.infrastructure.persistence.entity.ReviewTaskEntity;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@Primary
public class ReviewTaskRepositoryImpl implements ReviewTaskRepository {

    private final JpaReviewTaskRepository jpa;

    @Value("${review.lock.ttlMinutes:10}")
    private int ttlMinutes;

    private Duration lockTtl;

    @Value("${review.lock.dbFilter:false}")
    private boolean dbFilter;

    public ReviewTaskRepositoryImpl(JpaReviewTaskRepository jpa) {
        this.jpa = jpa;
    }

    @PostConstruct
    void init() { this.lockTtl = Duration.ofMinutes(ttlMinutes); }

    @Override
    public void save(ReviewTask task) {
        ReviewTaskEntity e = toEntity(task);
        jpa.save(e);
    }

    @Override
    public Optional<ReviewTask> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<ReviewTask> findActiveByApplicationAndStage(ApplicationId applicationId, ReviewStage stage) {
        if (dbFilter) {
            return jpa.findOneActiveNotExpired(applicationId.getValue(), toStageEntity(stage).name(), ttlMinutes)
                    .map(this::toDomain);
        }
        var list = jpa.findActiveCandidates(applicationId.getValue(),
                toStageEntity(stage), ReviewTaskEntity.StatusEntity.OPEN, ReviewTaskEntity.StatusEntity.ASSIGNED);
        return list.stream().map(this::toDomain)
                .filter(t -> t.getStatus() != ReviewTaskStatus.ASSIGNED || !t.isLockExpired(lockTtl))
                .findFirst();
    }

    @Override
    public List<ReviewTask> findAssignedTo(UUID reviewerId) {
        return jpa.findByAssignedToAndStatus(reviewerId, ReviewTaskEntity.StatusEntity.ASSIGNED)
                .stream().map(this::toDomain).toList();
    }

    @Override
    public List<ReviewTask> findOpenByExamIds(List<UUID> examIds, ReviewStage stage) {
        List<ReviewTaskEntity> list = (stage == null)
                ? jpa.findOpenByExamIds(examIds)
                : jpa.findOpenByExamIdsAndStage(examIds, toStageEntity(stage));
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    public List<ReviewTask> findOpenAll(ReviewStage stage) {
        List<ReviewTaskEntity> list = (stage == null)
                ? jpa.findByStatus(ReviewTaskEntity.StatusEntity.OPEN)
                : jpa.findByStatusAndStage(ReviewTaskEntity.StatusEntity.OPEN, toStageEntity(stage));
        return list.stream().map(this::toDomain).toList();
    }

    @Override
    public List<ReviewTask> findAssignedAll() {
        return jpa.findByStatus(ReviewTaskEntity.StatusEntity.ASSIGNED)
                .stream().map(this::toDomain).toList();
    }

    private ReviewTaskEntity toEntity(ReviewTask t) {
        ReviewTaskEntity e = new ReviewTaskEntity(t.getId(), t.getApplicationId().getValue(), toStageEntity(t.getStage()), toStatusEntity(t.getStatus()));
        e.setAssignedTo(t.getAssignedTo());
        e.setLockedAt(t.getLockedAt());
        e.setLastHeartbeatAt(t.getLastHeartbeatAt());
        e.setCreatedAt(t.getCreatedAt());
        return e;
    }

    private ReviewTask toDomain(ReviewTaskEntity e) {
        return ReviewTask.rebuild(
                e.getId(),
                ApplicationId.of(e.getApplicationId()),
                toDomainStage(e.getStage()),
                toDomainStatus(e.getStatus()),
                e.getAssignedTo(),
                e.getLockedAt(),
                e.getLastHeartbeatAt(),
                e.getCreatedAt()
        );
    }

    private ReviewTaskEntity.StageEntity toStageEntity(ReviewStage s) {
        return switch (s) {
            case PRIMARY -> ReviewTaskEntity.StageEntity.PRIMARY;
            case SECONDARY -> ReviewTaskEntity.StageEntity.SECONDARY;
        };
    }

    private ReviewStage toDomainStage(ReviewTaskEntity.StageEntity s) {
        return switch (s) {
            case PRIMARY -> ReviewStage.PRIMARY;
            case SECONDARY -> ReviewStage.SECONDARY;
        };
    }

    private ReviewTaskEntity.StatusEntity toStatusEntity(ReviewTaskStatus s) {
        return switch (s) {
            case OPEN -> ReviewTaskEntity.StatusEntity.OPEN;
            case ASSIGNED -> ReviewTaskEntity.StatusEntity.ASSIGNED;
            case COMPLETED -> ReviewTaskEntity.StatusEntity.COMPLETED;
            case CANCELLED -> ReviewTaskEntity.StatusEntity.CANCELLED;
        };
    }

    private ReviewTaskStatus toDomainStatus(ReviewTaskEntity.StatusEntity s) {
        return switch (s) {
            case OPEN -> ReviewTaskStatus.OPEN;
            case ASSIGNED -> ReviewTaskStatus.ASSIGNED;
            case COMPLETED -> ReviewTaskStatus.COMPLETED;
            case CANCELLED -> ReviewTaskStatus.CANCELLED;
        };
    }
}

