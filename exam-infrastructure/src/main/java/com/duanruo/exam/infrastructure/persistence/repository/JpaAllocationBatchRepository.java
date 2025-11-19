package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.AllocationBatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JpaAllocationBatchRepository extends JpaRepository<AllocationBatchEntity, UUID> {
    Optional<AllocationBatchEntity> findById(UUID id);
    List<AllocationBatchEntity> findByExamId(UUID examId);
}

