package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.review.*;
import com.duanruo.exam.infrastructure.persistence.entity.ReviewEntity;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 审核记录仓储实现
 */
@Repository
@Primary
public class ReviewRepositoryImpl implements ReviewRepository {

    private final JpaReviewRepository jpaReviewRepository;

    public ReviewRepositoryImpl(JpaReviewRepository jpaReviewRepository) {
        this.jpaReviewRepository = jpaReviewRepository;
    }

    @Override
    public void save(Review review) {
        ReviewEntity entity = toEntity(review);
        jpaReviewRepository.save(entity);
    }

    @Override
    public Optional<Review> findById(UUID id) {
        return jpaReviewRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Review> findByApplicationId(ApplicationId applicationId) {
        return jpaReviewRepository.findByApplicationId(applicationId.getValue())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<Review> findByApplicationIdAndStage(ApplicationId applicationId, ReviewStage stage) {
        return jpaReviewRepository.findByApplicationIdAndStage(
                applicationId.getValue(), 
                toStageString(stage)
        ).map(this::toDomain);
    }

    @Override
    public List<Review> findByReviewerId(UUID reviewerId) {
        return jpaReviewRepository.findByReviewerId(reviewerId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Review> findByStage(ReviewStage stage) {
        return jpaReviewRepository.findByStage(toStageString(stage))
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Review> findByDecision(ReviewDecision decision) {
        return jpaReviewRepository.findByDecision(toDecisionString(decision))
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Review> findPendingReviews() {
        return jpaReviewRepository.findPendingReviews()
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Review> findCompletedReviews() {
        return jpaReviewRepository.findCompletedReviews()
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public long countByApplicationId(ApplicationId applicationId) {
        return jpaReviewRepository.countByApplicationId(applicationId.getValue());
    }

    @Override
    public boolean existsByApplicationIdAndStage(ApplicationId applicationId, ReviewStage stage) {
        return jpaReviewRepository.existsByApplicationIdAndStage(
                applicationId.getValue(), 
                toStageString(stage)
        );
    }

    @Override
    public Optional<Review> findLatestByApplicationId(ApplicationId applicationId) {
        return jpaReviewRepository.findLatestByApplicationId(applicationId.getValue())
                .map(this::toDomain);
    }

    @Override
    public List<Review> findByReviewerIdAndReviewedAtBetween(UUID reviewerId, 
                                                              LocalDateTime startDate, 
                                                              LocalDateTime endDate) {
        return jpaReviewRepository.findByReviewerIdAndReviewedAtBetween(reviewerId, startDate, endDate)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public long countByReviewerId(UUID reviewerId) {
        return jpaReviewRepository.countByReviewerId(reviewerId);
    }

    @Override
    public long countByReviewerIdAndStage(UUID reviewerId, ReviewStage stage) {
        return jpaReviewRepository.countByReviewerIdAndStage(reviewerId, toStageString(stage));
    }

    @Override
    public long countApprovedByReviewerId(UUID reviewerId) {
        return jpaReviewRepository.countByReviewerIdAndDecision(reviewerId, "APPROVED");
    }

    @Override
    public long countRejectedByReviewerId(UUID reviewerId) {
        return jpaReviewRepository.countByReviewerIdAndDecision(reviewerId, "REJECTED");
    }

    // ========== 转换方法 ==========

    private ReviewEntity toEntity(Review review) {
        ReviewEntity entity = new ReviewEntity();
        entity.setId(review.getId());
        entity.setApplicationId(review.getApplicationId().getValue());
        entity.setStage(toStageString(review.getStage()));
        entity.setReviewerId(review.getReviewerId());
        entity.setDecision(toDecisionString(review.getDecision()));
        entity.setComment(review.getComment());
        entity.setReviewedAt(review.getReviewedAt());
        entity.setCreatedAt(review.getCreatedAt());
        return entity;
    }

    private Review toDomain(ReviewEntity entity) {
        return Review.rebuild(
                entity.getId(),
                ApplicationId.of(entity.getApplicationId()),
                toStageDomain(entity.getStage()),
                entity.getReviewerId(),
                toDecisionDomain(entity.getDecision()),
                entity.getComment(),
                entity.getReviewedAt(),
                entity.getCreatedAt()
        );
    }

    private String toStageString(ReviewStage stage) {
        return stage.name();
    }

    private ReviewStage toStageDomain(String stage) {
        return ReviewStage.valueOf(stage);
    }

    private String toDecisionString(ReviewDecision decision) {
        return decision == null ? null : decision.name();
    }

    private ReviewDecision toDecisionDomain(String decision) {
        return decision == null ? null : ReviewDecision.valueOf(decision);
    }
}

