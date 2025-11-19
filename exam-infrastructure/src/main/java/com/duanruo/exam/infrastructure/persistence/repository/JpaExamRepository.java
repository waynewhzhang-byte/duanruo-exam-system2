package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.ExamEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 考试JPA仓储接口
 */
@Repository
public interface JpaExamRepository extends JpaRepository<ExamEntity, UUID> {

    /**
     * 根据代码查找考试
     */
    Optional<ExamEntity> findByCode(String code);

    /**
     * 根据状态查找考试
     */
    List<ExamEntity> findByStatus(ExamEntity.ExamStatusEntity status);

    /**
     * 检查考试代码是否存在
     */
    boolean existsByCode(String code);

    /**
     * 根据创建者查找考试
     */
    List<ExamEntity> findByCreatedBy(UUID createdBy);

    /**
     * 查找开放报名的考试
     */
    List<ExamEntity> findByStatusOrderByCreatedAtDesc(ExamEntity.ExamStatusEntity status);
}
