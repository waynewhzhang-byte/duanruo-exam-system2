package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.application.*;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.infrastructure.persistence.entity.ApplicationEntity;
import com.duanruo.exam.infrastructure.persistence.mapper.ApplicationMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 申请仓储实现（领域端口 -> JPA）
 */
@Repository
public class ApplicationRepositoryImpl implements ApplicationRepository {

    private final JpaApplicationRepository jpa;
    private final ApplicationMapper mapper;

    public ApplicationRepositoryImpl(JpaApplicationRepository jpa, ApplicationMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    public void save(Application application) {
        // 更新 vs 新增：使用 ID 判定，JPA 会处理持久化
        ApplicationEntity entity = mapper.toEntity(application);
        jpa.save(entity);
    }

    @Override
    public Optional<Application> findById(ApplicationId id) {
        return jpa.findById(id.getValue()).map(mapper::toDomain);
    }

    @Override
    public Optional<Application> findByExamAndCandidate(ExamId examId, CandidateId candidateId) {
        return jpa.findByExamIdAndCandidateId(examId.getValue(), candidateId.getValue())
                .map(mapper::toDomain);
    }

    @Override
    public List<Application> findByCandidate(CandidateId candidateId) {
        return jpa.findByCandidateId(candidateId.getValue()).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findByExam(ExamId examId) {
        return jpa.findByExamId(examId.getValue()).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findByPosition(PositionId positionId) {
        return jpa.findByPositionId(positionId.getValue()).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findByStatus(ApplicationStatus status) {
        ApplicationEntity.ApplicationStatusEntity s = mapper.mapToEntityStatus(status);
        return jpa.findByStatus(s).stream().map(mapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public long countByPosition(PositionId positionId) {
        return jpa.countByPositionId(positionId.getValue());
    }

    @Override
    public boolean existsByExamAndCandidate(ExamId examId, CandidateId candidateId) {
        return jpa.existsByExamIdAndCandidateId(examId.getValue(), candidateId.getValue());
    }

    @Override
    public boolean hasSubmittedApplications(PositionId positionId) {
        return jpa.existsSubmittedByPositionId(positionId.getValue());
    }

    @Override
    public boolean hasSubmittedApplicationsForExam(ExamId examId) {
        return jpa.existsSubmittedByExamId(examId.getValue());
    }

    @Override
    public List<Application> findByExamIdAndStatus(java.util.UUID examId, ApplicationStatus status) {
        ApplicationEntity.ApplicationStatusEntity s = mapper.mapToEntityStatus(status);
        return jpa.findByExamIdAndStatus(examId, s).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(ApplicationId id) {
        jpa.deleteById(id.getValue());
    }
}

