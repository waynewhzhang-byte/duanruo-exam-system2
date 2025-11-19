package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.review.ExamReviewerRepository;
import com.duanruo.exam.domain.review.ReviewStage;
import com.duanruo.exam.infrastructure.persistence.entity.ExamReviewerEntity;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@Primary
public class ExamReviewerRepositoryImpl implements ExamReviewerRepository {
    private final JpaExamReviewerRepository jpa;

    public ExamReviewerRepositoryImpl(JpaExamReviewerRepository jpa) {
        this.jpa = jpa;
    }

    private ExamReviewerEntity.StageEntity toStageEntity(ReviewStage s) {
        return switch (s) {
            case PRIMARY -> ExamReviewerEntity.StageEntity.PRIMARY;
            case SECONDARY -> ExamReviewerEntity.StageEntity.SECONDARY;
        };
    }

    @Override
    public void add(UUID examId, UUID reviewerId, ReviewStage stage) {
        if (!jpa.existsByExamIdAndReviewerIdAndStage(examId, reviewerId, toStageEntity(stage))) {
            jpa.save(new ExamReviewerEntity(examId, reviewerId, toStageEntity(stage)));
        }
    }

    @Override
    public void remove(UUID examId, UUID reviewerId, ReviewStage stage) {
        jpa.deleteByExamIdAndReviewerIdAndStage(examId, reviewerId, toStageEntity(stage));
    }

    @Override
    public boolean exists(UUID examId, UUID reviewerId, ReviewStage stage) {
        return jpa.existsByExamIdAndReviewerIdAndStage(examId, reviewerId, toStageEntity(stage));
    }

    @Override
    public List<UUID> findExamIdsByReviewer(UUID reviewerId) {
        return jpa.findByReviewerId(reviewerId).stream().map(ExamReviewerEntity::getExamId).distinct().toList();
    }

    @Override
    public List<UUID> findReviewerIdsByExam(UUID examId, ReviewStage stage) {
        return jpa.findByExamId(examId).stream()
                .filter(e -> stage == null || e.getStage() == toStageEntity(stage))
                .map(ExamReviewerEntity::getReviewerId)
                .distinct().toList();
    }

    @Override
    public List<ExamReviewerInfo> findReviewerInfosByExam(UUID examId) {
        return jpa.findByExamId(examId).stream()
                .map(e -> new ExamReviewerInfo(
                    e.getId(),
                    e.getReviewerId(),
                    e.getStage() == ExamReviewerEntity.StageEntity.PRIMARY ? ReviewStage.PRIMARY : ReviewStage.SECONDARY,
                    e.getCreatedAt()
                ))
                .toList();
    }
}

