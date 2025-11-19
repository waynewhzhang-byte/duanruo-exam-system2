package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.PositionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 岗位JPA仓储接口
 */
@Repository
public interface JpaPositionRepository extends JpaRepository<PositionEntity, UUID> {

    /**
     * 根据考试ID查找岗位
     */
    List<PositionEntity> findByExamId(UUID examId);

    /**
     * 根据考试ID和代码查找岗位
     */
    Optional<PositionEntity> findByExamIdAndCode(UUID examId, String code);

    /**
     * 检查岗位代码在考试中是否存在
     */
    boolean existsByExamIdAndCode(UUID examId, String code);

    /**
     * 根据考试ID删除所有岗位
     */
    void deleteByExamId(UUID examId);
}
