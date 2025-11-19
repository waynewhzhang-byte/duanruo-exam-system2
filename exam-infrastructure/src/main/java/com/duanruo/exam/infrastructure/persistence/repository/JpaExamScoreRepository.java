package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.score.ExamScore;
import com.duanruo.exam.domain.score.ExamScoreId;
import com.duanruo.exam.domain.score.ExamScoreRepository;
import com.duanruo.exam.domain.exam.SubjectId;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.infrastructure.persistence.entity.ExamScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 考试成绩Repository的JPA实现
 */
@Repository
public class JpaExamScoreRepository implements ExamScoreRepository {

    private final SpringDataExamScoreRepository jpaRepository;

    public JpaExamScoreRepository(SpringDataExamScoreRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    @Transactional
    public void save(ExamScore examScore) {
        ExamScoreEntity entity = toEntity(examScore);
        jpaRepository.save(entity);
    }

    @Override
    public Optional<ExamScore> findById(ExamScoreId id) {
        return jpaRepository.findById(id.getValue())
                .map(this::toDomain);
    }

    @Override
    public Optional<ExamScore> findByApplicationIdAndSubjectId(ApplicationId applicationId, SubjectId subjectId) {
        return jpaRepository.findByApplicationIdAndSubjectId(applicationId.getValue(), subjectId.getValue())
                .map(this::toDomain);
    }

    @Override
    public List<ExamScore> findByApplicationId(ApplicationId applicationId) {
        return jpaRepository.findByApplicationId(applicationId.getValue())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<ExamScore> findBySubjectId(SubjectId subjectId) {
        return jpaRepository.findBySubjectId(subjectId.getValue())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<ExamScore> findByExamId(ExamId examId) {
        return jpaRepository.findByExamId(examId.getValue())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<ExamScore> findByPositionId(PositionId positionId) {
        return jpaRepository.findByPositionId(positionId.getValue())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteById(ExamScoreId id) {
        jpaRepository.deleteById(id.getValue());
    }

    @Override
    @Transactional
    public void saveAll(List<ExamScore> examScores) {
        List<ExamScoreEntity> entities = examScores.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
        jpaRepository.saveAll(entities);
    }

    @Override
    public boolean existsByApplicationId(ApplicationId applicationId) {
        return jpaRepository.existsByApplicationId(applicationId.getValue());
    }

    @Override
    public long countByExamId(ExamId examId) {
        return jpaRepository.countByExamId(examId.getValue());
    }

    @Override
    public long countBySubjectId(SubjectId subjectId) {
        return jpaRepository.countBySubjectId(subjectId.getValue());
    }

    /**
     * 将领域对象转换为实体
     */
    private ExamScoreEntity toEntity(ExamScore examScore) {
        ExamScoreEntity entity = new ExamScoreEntity();
        entity.setId(examScore.getId().getValue());
        entity.setApplicationId(examScore.getApplicationId().getValue());
        entity.setSubjectId(examScore.getSubjectId().getValue());
        entity.setScore(examScore.getScore());
        entity.setIsAbsent(examScore.isAbsent());
        entity.setGradedBy(examScore.getGradedBy() != null ? examScore.getGradedBy().getValue() : null);
        entity.setGradedAt(examScore.getGradedAt());
        entity.setRemarks(examScore.getRemarks());
        entity.setCreatedAt(examScore.getCreatedAt());
        entity.setUpdatedAt(examScore.getUpdatedAt());
        return entity;
    }

    /**
     * 将实体转换为领域对象
     */
    private ExamScore toDomain(ExamScoreEntity entity) {
        return ExamScore.reconstruct(
            ExamScoreId.of(entity.getId()),
            ApplicationId.of(entity.getApplicationId()),
            SubjectId.of(entity.getSubjectId()),
            entity.getScore(),
            entity.getIsAbsent(),
            entity.getGradedBy() != null ? UserId.of(entity.getGradedBy()) : null,
            entity.getGradedAt(),
            entity.getRemarks(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}

/**
 * Spring Data JPA Repository接口
 */
interface SpringDataExamScoreRepository extends JpaRepository<ExamScoreEntity, UUID> {

    Optional<ExamScoreEntity> findByApplicationIdAndSubjectId(UUID applicationId, UUID subjectId);

    List<ExamScoreEntity> findByApplicationId(UUID applicationId);

    List<ExamScoreEntity> findBySubjectId(UUID subjectId);

    boolean existsByApplicationId(UUID applicationId);

    long countBySubjectId(UUID subjectId);

    @Query("SELECT s FROM ExamScoreEntity s " +
           "JOIN ApplicationEntity a ON s.applicationId = a.id " +
           "WHERE a.examId = :examId")
    List<ExamScoreEntity> findByExamId(@Param("examId") UUID examId);

    @Query("SELECT s FROM ExamScoreEntity s " +
           "JOIN SubjectEntity sub ON s.subjectId = sub.id " +
           "WHERE sub.positionId = :positionId")
    List<ExamScoreEntity> findByPositionId(@Param("positionId") UUID positionId);

    @Query("SELECT COUNT(s) FROM ExamScoreEntity s " +
           "JOIN ApplicationEntity a ON s.applicationId = a.id " +
           "WHERE a.examId = :examId")
    long countByExamId(@Param("examId") UUID examId);
}
