package com.duanruo.exam.infrastructure.persistence.inmemory;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.seating.SeatAssignment;
import com.duanruo.exam.domain.seating.SeatAssignmentRepository;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemorySeatAssignmentRepository implements SeatAssignmentRepository {
    private final Map<UUID, SeatAssignment> byId = new ConcurrentHashMap<>();
    private final Map<ApplicationId, SeatAssignment> byApplication = new ConcurrentHashMap<>();

    @Override
    public void saveAll(Collection<SeatAssignment> assignments) {
        for (SeatAssignment s : assignments) {
            byId.put(s.getId(), s);
            byApplication.put(s.getApplicationId(), s);
        }
    }

    @Override
    public List<SeatAssignment> findByExamId(ExamId examId) {
        return byId.values().stream().filter(s -> s.getExamId().equals(examId)).collect(Collectors.toList());
    }

    @Override
    public Optional<SeatAssignment> findByApplicationId(ApplicationId applicationId) {
        return Optional.ofNullable(byApplication.get(applicationId));
    }

    @Override
    public void deleteByExamId(ExamId examId) {
        var ids = byId.values().stream().filter(s -> s.getExamId().equals(examId)).map(SeatAssignment::getId).collect(Collectors.toSet());
        for (UUID id : ids) {
            SeatAssignment s = byId.remove(id);
            if (s != null) {
                byApplication.remove(s.getApplicationId());
            }
        }
    }

    @Override
    public List<SeatAssignment> findByBatchId(UUID batchId) {
        return byId.values().stream().filter(s -> Objects.equals(s.getBatchId(), batchId)).collect(Collectors.toList());
    }
}

