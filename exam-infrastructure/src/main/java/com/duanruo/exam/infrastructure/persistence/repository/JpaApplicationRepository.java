package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.ApplicationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 申请JPA仓储
 */
@Repository
public interface JpaApplicationRepository extends JpaRepository<ApplicationEntity, UUID> {
    
    /**
     * 根据考试和候选人查找申请
     */
    Optional<ApplicationEntity> findByExamIdAndCandidateId(UUID examId, UUID candidateId);
    
    /**
     * 根据候选人查找所有申请
     */
    List<ApplicationEntity> findByCandidateId(UUID candidateId);
    
    /**
     * 根据考试查找所有申请
     */
    List<ApplicationEntity> findByExamId(UUID examId);
    
    /**
     * 根据岗位查找所有申请
     */
    List<ApplicationEntity> findByPositionId(UUID positionId);
    
    /**
     * 根据状态查找申请
     */
    List<ApplicationEntity> findByStatus(ApplicationEntity.ApplicationStatusEntity status);

    /**
     * 根据考试ID和状态查找申请
     */
    List<ApplicationEntity> findByExamIdAndStatus(UUID examId, ApplicationEntity.ApplicationStatusEntity status);

    /**
     * 统计岗位的申请数量
     */
    long countByPositionId(UUID positionId);

    /**
     * 检查候选人是否已报名某考试
     */
    boolean existsByExamIdAndCandidateId(UUID examId, UUID candidateId);

    /**
     * 查找需要自动审核的申请
     */
    @Query("SELECT a FROM ApplicationEntity a WHERE a.status = 'SUBMITTED' ORDER BY a.submittedAt ASC")
    List<ApplicationEntity> findPendingAutoReview();

    /**
     * 查找需要人工审核的申请
     */
    @Query("SELECT a FROM ApplicationEntity a WHERE a.status IN ('PENDING_PRIMARY_REVIEW', 'PENDING_SECONDARY_REVIEW') ORDER BY a.submittedAt ASC")
    List<ApplicationEntity> findPendingManualReview();

    /**
     * 统计考试的申请数量
     */
    long countByExamId(UUID examId);

    /**
     * 统计考试中指定状态的申请数量
     */
    long countByExamIdAndStatus(UUID examId, ApplicationEntity.ApplicationStatusEntity status);

    /**
     * 按日期统计考试的申请数量
     */
    @Query("SELECT FUNCTION('DATE', a.createdAt) as date, COUNT(a) as count " +
           "FROM ApplicationEntity a " +
           "WHERE a.examId = :examId " +
           "GROUP BY FUNCTION('DATE', a.createdAt) " +
           "ORDER BY date")
    List<Object[]> countByExamIdGroupByDate(@Param("examId") UUID examId);

    /**
     * 统计岗位中指定状态的申请数量
     */
    long countByPositionIdAndStatus(UUID positionId, ApplicationEntity.ApplicationStatusEntity status);

    /**
     * 检查岗位是否有非草稿状态的报名
     * 用于判断岗位表单配置是否可以修改
     */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
           "FROM ApplicationEntity a " +
           "WHERE a.positionId = :positionId " +
           "AND a.status != 'DRAFT'")
    boolean existsSubmittedByPositionId(@Param("positionId") UUID positionId);

    /**
     * 检查考试是否有非草稿状态的报名
     * 用于判断考试表单配置是否可以修改
     */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
           "FROM ApplicationEntity a " +
           "WHERE a.examId = :examId " +
           "AND a.status != 'DRAFT'")
    boolean existsSubmittedByExamId(@Param("examId") UUID examId);
}
