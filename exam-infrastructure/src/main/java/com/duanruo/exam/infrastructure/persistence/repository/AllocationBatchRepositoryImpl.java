package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.seating.AllocationBatch;
import com.duanruo.exam.domain.seating.AllocationBatchRepository;
import com.duanruo.exam.infrastructure.persistence.entity.AllocationBatchEntity;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Primary
public class AllocationBatchRepositoryImpl implements AllocationBatchRepository {

    private final JpaAllocationBatchRepository jpa;

    public AllocationBatchRepositoryImpl(JpaAllocationBatchRepository jpa) { this.jpa = jpa; }

    @Override
    public void save(AllocationBatch batch) {
        AllocationBatchEntity e = toEntity(batch);
        jpa.save(e);
    }

    @Override
    public Optional<AllocationBatch> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public List<AllocationBatch> findByExamId(ExamId examId) {
        return jpa.findByExamId(examId.getValue()).stream().map(this::toDomain).collect(Collectors.toList());
    }

    private AllocationBatchEntity toEntity(AllocationBatch b) {
        AllocationBatchEntity e = new AllocationBatchEntity(b.getId(), b.getExamId().getValue(), b.getStrategy(), b.getCreatedBy());
        e.setTotalCandidates(b.getTotalCandidates());
        e.setTotalAssigned(b.getTotalAssigned());
        e.setTotalVenues(b.getTotalVenues());
        e.setCreatedAt(b.getCreatedAt());
        return e;
    }

    private AllocationBatch toDomain(AllocationBatchEntity e) {
        try {
            AllocationBatch b = AllocationBatch.create(ExamId.of(e.getExamId()), e.getStrategy(), e.getCreatedBy());
            Field fId = AllocationBatch.class.getDeclaredField("id"); fId.setAccessible(true); fId.set(b, e.getId());
            Field fCreated = AllocationBatch.class.getDeclaredField("createdAt"); fCreated.setAccessible(true); fCreated.set(b, e.getCreatedAt());
            Field fTotalCand = AllocationBatch.class.getDeclaredField("totalCandidates"); fTotalCand.setAccessible(true); fTotalCand.setInt(b, e.getTotalCandidates());
            Field fTotalAssigned = AllocationBatch.class.getDeclaredField("totalAssigned"); fTotalAssigned.setAccessible(true); fTotalAssigned.setInt(b, e.getTotalAssigned());
            Field fTotalVenues = AllocationBatch.class.getDeclaredField("totalVenues"); fTotalVenues.setAccessible(true); fTotalVenues.setInt(b, e.getTotalVenues());
            return b;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to rebuild AllocationBatch", ex);
        }
    }
}

