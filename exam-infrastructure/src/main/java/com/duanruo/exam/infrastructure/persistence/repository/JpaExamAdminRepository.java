package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.admin.ExamAdminRepository;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.infrastructure.persistence.entity.ExamAdminEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 考试管理员Repository的JPA实现
 */
@Repository
public class JpaExamAdminRepository implements ExamAdminRepository {

    private final SpringDataExamAdminRepository jpaRepository;

    public JpaExamAdminRepository(SpringDataExamAdminRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    @Transactional
    public void add(ExamId examId, UserId adminId, Map<String, Object> permissions, UserId createdBy) {
        ExamAdminEntity entity = new ExamAdminEntity(
            examId.getValue(),
            adminId.getValue(),
            permissions,
            createdBy.getValue()
        );
        jpaRepository.save(entity);
    }

    @Override
    @Transactional
    public void remove(ExamId examId, UserId adminId) {
        jpaRepository.deleteByExamIdAndAdminId(examId.getValue(), adminId.getValue());
    }

    @Override
    public boolean exists(ExamId examId, UserId adminId) {
        return jpaRepository.existsByExamIdAndAdminId(examId.getValue(), adminId.getValue());
    }

    @Override
    public List<ExamId> findExamIdsByAdmin(UserId adminId) {
        return jpaRepository.findExamIdsByAdminId(adminId.getValue())
                .stream()
                .map(ExamId::of)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserId> findAdminIdsByExam(ExamId examId) {
        return jpaRepository.findAdminIdsByExamId(examId.getValue())
                .stream()
                .map(UserId::of)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Map<String, Object>> findPermissions(ExamId examId, UserId adminId) {
        return jpaRepository.findByExamIdAndAdminId(examId.getValue(), adminId.getValue())
                .map(ExamAdminEntity::getPermissions);
    }

    @Override
    @Transactional
    public void updatePermissions(ExamId examId, UserId adminId, Map<String, Object> permissions) {
        Optional<ExamAdminEntity> entityOpt = jpaRepository.findByExamIdAndAdminId(
            examId.getValue(), adminId.getValue());
        
        if (entityOpt.isPresent()) {
            ExamAdminEntity entity = entityOpt.get();
            entity.setPermissions(permissions);
            jpaRepository.save(entity);
        }
    }

    @Override
    @Transactional
    public void addBatch(ExamId examId, List<UserId> adminIds, Map<String, Object> permissions, UserId createdBy) {
        List<ExamAdminEntity> entities = adminIds.stream()
                .map(adminId -> new ExamAdminEntity(
                    examId.getValue(),
                    adminId.getValue(),
                    permissions,
                    createdBy.getValue()
                ))
                .collect(Collectors.toList());
        
        jpaRepository.saveAll(entities);
    }

    @Override
    @Transactional
    public void removeBatch(ExamId examId, List<UserId> adminIds) {
        List<UUID> adminUuids = adminIds.stream()
                .map(UserId::getValue)
                .collect(Collectors.toList());
        
        jpaRepository.deleteByExamIdAndAdminIdIn(examId.getValue(), adminUuids);
    }

    @Override
    public Map<ExamId, List<UserId>> findAllExamAdmins() {
        return jpaRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    entity -> ExamId.of(entity.getExamId()),
                    Collectors.mapping(
                        entity -> UserId.of(entity.getAdminId()),
                        Collectors.toList()
                    )
                ));
    }
}

/**
 * Spring Data JPA Repository接口
 */
interface SpringDataExamAdminRepository extends JpaRepository<ExamAdminEntity, UUID> {

    boolean existsByExamIdAndAdminId(UUID examId, UUID adminId);

    Optional<ExamAdminEntity> findByExamIdAndAdminId(UUID examId, UUID adminId);

    @Query("SELECT e.examId FROM ExamAdminEntity e WHERE e.adminId = :adminId")
    List<UUID> findExamIdsByAdminId(@Param("adminId") UUID adminId);

    @Query("SELECT e.adminId FROM ExamAdminEntity e WHERE e.examId = :examId")
    List<UUID> findAdminIdsByExamId(@Param("examId") UUID examId);

    @Modifying
    @Query("DELETE FROM ExamAdminEntity e WHERE e.examId = :examId AND e.adminId = :adminId")
    void deleteByExamIdAndAdminId(@Param("examId") UUID examId, @Param("adminId") UUID adminId);

    @Modifying
    @Query("DELETE FROM ExamAdminEntity e WHERE e.examId = :examId AND e.adminId IN :adminIds")
    void deleteByExamIdAndAdminIdIn(@Param("examId") UUID examId, @Param("adminIds") List<UUID> adminIds);
}
