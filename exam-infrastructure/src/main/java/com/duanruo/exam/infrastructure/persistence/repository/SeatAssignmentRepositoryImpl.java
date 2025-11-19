package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.seating.SeatAssignment;
import com.duanruo.exam.domain.seating.SeatAssignmentRepository;
import com.duanruo.exam.domain.venue.VenueId;
import com.duanruo.exam.infrastructure.persistence.entity.SeatAssignmentEntity;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.lang.reflect.Field;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Primary
public class SeatAssignmentRepositoryImpl implements SeatAssignmentRepository {

    private final JpaSeatAssignmentRepository jpa;

    public SeatAssignmentRepositoryImpl(JpaSeatAssignmentRepository jpa) { this.jpa = jpa; }

    @Override
    public void saveAll(Collection<SeatAssignment> assignments) {
        List<SeatAssignmentEntity> list = assignments.stream().map(this::toEntity).toList();
        jpa.saveAll(list);
    }

    @Override
    public List<SeatAssignment> findByExamId(ExamId examId) {
        return jpa.findByExamId(examId.getValue()).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<SeatAssignment> findByApplicationId(ApplicationId applicationId) {
        return jpa.findByApplicationId(applicationId.getValue()).map(this::toDomain);
    }

    @Override
    public void deleteByExamId(ExamId examId) {
        jpa.deleteByExamId(examId.getValue());
    }

    @Override
    public List<SeatAssignment> findByBatchId(UUID batchId) {
        return jpa.findByBatchId(batchId).stream().map(this::toDomain).toList();
    }

    private SeatAssignmentEntity toEntity(SeatAssignment s) {
        return new SeatAssignmentEntity(s.getId(), s.getExamId().getValue(), s.getPositionId().getValue(),
                s.getApplicationId().getValue(), s.getVenueId().getValue(), s.getSeatNo(), s.getBatchId());
    }

    private SeatAssignment toDomain(SeatAssignmentEntity e) {
        try {
            SeatAssignment s = SeatAssignment.create(ExamId.of(e.getExamId()), PositionId.of(e.getPositionId()),
                    ApplicationId.of(e.getApplicationId()), VenueId.of(e.getVenueId()), e.getSeatNo(), e.getBatchId());
            // overwrite generated fields via reflection
            Field fId = SeatAssignment.class.getDeclaredField("id"); fId.setAccessible(true); fId.set(s, e.getId());
            Field fCreated = SeatAssignment.class.getDeclaredField("createdAt"); fCreated.setAccessible(true); fCreated.set(s, e.getCreatedAt());
            return s;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to rebuild SeatAssignment", ex);
        }
    }
}

