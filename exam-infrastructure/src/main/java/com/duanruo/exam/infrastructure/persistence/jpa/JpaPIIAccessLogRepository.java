package com.duanruo.exam.infrastructure.persistence.jpa;

import com.duanruo.exam.domain.pii.PIIAccessType;
import com.duanruo.exam.infrastructure.persistence.entity.PIIAccessLogEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * PII访问日志JPA仓储
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
@Repository
public interface JpaPIIAccessLogRepository extends JpaRepository<PIIAccessLogEntity, UUID> {
    
    /**
     * 根据用户ID和时间范围查询访问日志
     */
    @Query("SELECT p FROM PIIAccessLogEntity p WHERE p.userId = :userId " +
           "AND p.accessedAt BETWEEN :startTime AND :endTime " +
           "ORDER BY p.accessedAt DESC")
    List<PIIAccessLogEntity> findByUserIdAndTimeRange(
            @Param("userId") UUID userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * 根据资源和时间范围查询访问日志
     */
    @Query("SELECT p FROM PIIAccessLogEntity p WHERE p.resourceType = :resourceType " +
           "AND p.resourceId = :resourceId " +
           "AND p.accessedAt BETWEEN :startTime AND :endTime " +
           "ORDER BY p.accessedAt DESC")
    List<PIIAccessLogEntity> findByResourceAndTimeRange(
            @Param("resourceType") String resourceType,
            @Param("resourceId") String resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * 根据访问类型和时间范围查询访问日志
     */
    @Query("SELECT p FROM PIIAccessLogEntity p WHERE p.accessType = :accessType " +
           "AND p.accessedAt BETWEEN :startTime AND :endTime " +
           "ORDER BY p.accessedAt DESC")
    List<PIIAccessLogEntity> findByAccessTypeAndTimeRange(
            @Param("accessType") PIIAccessType accessType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * 根据时间范围查询所有访问日志（分页）
     */
    @Query("SELECT p FROM PIIAccessLogEntity p WHERE p.accessedAt BETWEEN :startTime AND :endTime " +
           "ORDER BY p.accessedAt DESC")
    List<PIIAccessLogEntity> findByTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);
    
    /**
     * 统计访问次数
     */
    @Query("SELECT COUNT(p) FROM PIIAccessLogEntity p WHERE " +
           "(:userId IS NULL OR p.userId = :userId) " +
           "AND (:resourceType IS NULL OR p.resourceType = :resourceType) " +
           "AND p.accessedAt BETWEEN :startTime AND :endTime")
    long countByConditions(
            @Param("userId") UUID userId,
            @Param("resourceType") String resourceType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * 删除指定时间之前的日志
     */
    @Modifying
    @Query("DELETE FROM PIIAccessLogEntity p WHERE p.accessedAt < :before")
    int deleteByAccessedAtBefore(@Param("before") LocalDateTime before);
}

