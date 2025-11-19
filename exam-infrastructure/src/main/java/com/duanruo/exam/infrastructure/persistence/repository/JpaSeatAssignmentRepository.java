package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.SeatAssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JpaSeatAssignmentRepository extends JpaRepository<SeatAssignmentEntity, UUID> {
    List<SeatAssignmentEntity> findByExamId(UUID examId);
    List<SeatAssignmentEntity> findByBatchId(UUID batchId);
    Optional<SeatAssignmentEntity> findByApplicationId(UUID applicationId);
    void deleteByExamId(UUID examId);
}

