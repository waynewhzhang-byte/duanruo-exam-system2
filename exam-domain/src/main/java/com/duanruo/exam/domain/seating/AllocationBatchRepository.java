package com.duanruo.exam.domain.seating;

import com.duanruo.exam.domain.exam.ExamId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AllocationBatchRepository {
    void save(AllocationBatch batch);
    Optional<AllocationBatch> findById(UUID id);
    List<AllocationBatch> findByExamId(ExamId examId);
}

