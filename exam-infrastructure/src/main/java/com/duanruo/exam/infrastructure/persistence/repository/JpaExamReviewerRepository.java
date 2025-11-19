package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.ExamReviewerEntity;
import com.duanruo.exam.infrastructure.persistence.entity.ExamReviewerEntity.StageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaExamReviewerRepository extends JpaRepository<ExamReviewerEntity, Long> {
    boolean existsByExamIdAndReviewerIdAndStage(UUID examId, UUID reviewerId, StageEntity stage);
    void deleteByExamIdAndReviewerIdAndStage(UUID examId, UUID reviewerId, StageEntity stage);
    List<ExamReviewerEntity> findByExamId(UUID examId);
    List<ExamReviewerEntity> findByReviewerId(UUID reviewerId);
}

