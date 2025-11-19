package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 审核记录JPA仓储接口
 * 用于查询审核历史记录
 */
@Repository
public interface JpaReviewRepository extends JpaRepository<ReviewEntity, UUID> {

    /**
     * 根据申请ID查找所有审核记录
     */
    List<ReviewEntity> findByApplicationId(UUID applicationId);

    /**
     * 根据申请ID和审核阶段查找审核记录
     */
    Optional<ReviewEntity> findByApplicationIdAndStage(UUID applicationId, String stage);

    /**
     * 根据审核员ID查找所有审核记录
     */
    List<ReviewEntity> findByReviewerId(UUID reviewerId);

    /**
     * 根据审核阶段查找所有审核记录
     */
    List<ReviewEntity> findByStage(String stage);

    /**
     * 根据审核决定查找所有审核记录
     */
    List<ReviewEntity> findByDecision(String decision);

    /**
     * 根据审核员ID和审核阶段查找审核记录
     */
    List<ReviewEntity> findByReviewerIdAndStage(UUID reviewerId, String stage);

    /**
     * 根据审核员ID和审核决定查找审核记录
     */
    List<ReviewEntity> findByReviewerIdAndDecision(UUID reviewerId, String decision);

    /**
     * 查找指定时间范围内的审核记录
     */
    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewedAt BETWEEN :startDate AND :endDate ORDER BY r.reviewedAt DESC")
    List<ReviewEntity> findByReviewedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                                @Param("endDate") LocalDateTime endDate);

    /**
     * 查找待审核的记录（decision为null）
     */
    @Query("SELECT r FROM ReviewEntity r WHERE r.decision IS NULL ORDER BY r.createdAt ASC")
    List<ReviewEntity> findPendingReviews();

    /**
     * 查找已完成的审核记录（decision不为null）
     */
    @Query("SELECT r FROM ReviewEntity r WHERE r.decision IS NOT NULL ORDER BY r.reviewedAt DESC")
    List<ReviewEntity> findCompletedReviews();

    /**
     * 统计申请的审核记录数量
     */
    long countByApplicationId(UUID applicationId);

    /**
     * 统计审核员的审核记录数量
     */
    long countByReviewerId(UUID reviewerId);

    /**
     * 统计指定阶段的审核记录数量
     */
    long countByStage(String stage);

    /**
     * 统计指定决定的审核记录数量
     */
    long countByDecision(String decision);

    /**
     * 检查申请是否已有指定阶段的审核记录
     */
    boolean existsByApplicationIdAndStage(UUID applicationId, String stage);

    /**
     * 查找审核员在指定时间范围内的审核记录
     */
    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewerId = :reviewerId " +
           "AND r.reviewedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY r.reviewedAt DESC")
    List<ReviewEntity> findByReviewerIdAndReviewedAtBetween(
            @Param("reviewerId") UUID reviewerId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * 查找申请的最新审核记录
     */
    @Query("SELECT r FROM ReviewEntity r WHERE r.applicationId = :applicationId " +
           "ORDER BY r.createdAt DESC LIMIT 1")
    Optional<ReviewEntity> findLatestByApplicationId(@Param("applicationId") UUID applicationId);

    /**
     * 查找申请在指定阶段的最新审核记录
     */
    @Query("SELECT r FROM ReviewEntity r WHERE r.applicationId = :applicationId " +
           "AND r.stage = :stage ORDER BY r.createdAt DESC LIMIT 1")
    Optional<ReviewEntity> findLatestByApplicationIdAndStage(
            @Param("applicationId") UUID applicationId,
            @Param("stage") String stage);

    /**
     * 统计审核员在指定阶段的审核数量
     */
    long countByReviewerIdAndStage(UUID reviewerId, String stage);

    /**
     * 统计审核员指定决定的数量
     */
    long countByReviewerIdAndDecision(UUID reviewerId, String decision);
}

