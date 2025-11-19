package com.duanruo.exam.domain.seating;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SeatAssignmentRepository {
    void saveAll(java.util.Collection<SeatAssignment> assignments);
    List<SeatAssignment> findByExamId(ExamId examId);
    Optional<SeatAssignment> findByApplicationId(ApplicationId applicationId);
    void deleteByExamId(ExamId examId);
    List<SeatAssignment> findByBatchId(UUID batchId);
}

