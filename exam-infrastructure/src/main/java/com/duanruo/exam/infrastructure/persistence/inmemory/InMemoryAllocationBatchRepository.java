package com.duanruo.exam.infrastructure.persistence.inmemory;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.seating.AllocationBatch;
import com.duanruo.exam.domain.seating.AllocationBatchRepository;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryAllocationBatchRepository implements AllocationBatchRepository {
    private final Map<java.util.UUID, AllocationBatch> store = new ConcurrentHashMap<>();

    @Override
    public void save(AllocationBatch batch) {
        store.put(batch.getId(), batch);
    }

    @Override
    public Optional<AllocationBatch> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<AllocationBatch> findByExamId(ExamId examId) {
        return store.values().stream().filter(b -> b.getExamId().equals(examId)).collect(Collectors.toList());
    }
}

