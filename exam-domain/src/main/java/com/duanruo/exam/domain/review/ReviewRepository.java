package com.duanruo.exam.domain.review;

import com.duanruo.exam.domain.application.ApplicationId;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 审核记录仓储接口
 * 
 * 用于管理不可变的审核历史记录
 */
public interface ReviewRepository {
    
    /**
     * 保存审核记录
     */
    void save(Review review);
    
    /**
     * 根据ID查找审核记录
     */
    Optional<Review> findById(UUID id);
    
    /**
     * 根据申请ID查找所有审核记录
     */
    List<Review> findByApplicationId(ApplicationId applicationId);
    
    /**
     * 根据申请ID和审核阶段查找审核记录
     */
    Optional<Review> findByApplicationIdAndStage(ApplicationId applicationId, ReviewStage stage);
    
    /**
     * 根据审核员ID查找所有审核记录
     */
    List<Review> findByReviewerId(UUID reviewerId);
    
    /**
     * 根据审核阶段查找所有审核记录
     */
    List<Review> findByStage(ReviewStage stage);
    
    /**
     * 根据审核决定查找所有审核记录
     */
    List<Review> findByDecision(ReviewDecision decision);
    
    /**
     * 查找待审核的记录
     */
    List<Review> findPendingReviews();
    
    /**
     * 查找已完成的审核记录
     */
    List<Review> findCompletedReviews();
    
    /**
     * 统计申请的审核记录数量
     */
    long countByApplicationId(ApplicationId applicationId);
    
    /**
     * 检查申请在指定阶段是否已有审核记录
     */
    boolean existsByApplicationIdAndStage(ApplicationId applicationId, ReviewStage stage);
    
    /**
     * 查找申请的最新审核记录
     */
    Optional<Review> findLatestByApplicationId(ApplicationId applicationId);
    
    /**
     * 查找审核员在指定时间范围内的审核记录
     */
    List<Review> findByReviewerIdAndReviewedAtBetween(UUID reviewerId, 
                                                       LocalDateTime startDate, 
                                                       LocalDateTime endDate);
    
    /**
     * 统计审核员的审核数量
     */
    long countByReviewerId(UUID reviewerId);
    
    /**
     * 统计审核员在指定阶段的审核数量
     */
    long countByReviewerIdAndStage(UUID reviewerId, ReviewStage stage);
    
    /**
     * 统计审核员的通过数量
     */
    long countApprovedByReviewerId(UUID reviewerId);
    
    /**
     * 统计审核员的拒绝数量
     */
    long countRejectedByReviewerId(UUID reviewerId);
}

