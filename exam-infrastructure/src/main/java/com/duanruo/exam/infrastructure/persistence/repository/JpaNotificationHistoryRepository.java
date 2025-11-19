package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.NotificationHistoryEntity;
import com.duanruo.exam.infrastructure.persistence.entity.NotificationHistoryEntity.ChannelEntity;
import com.duanruo.exam.infrastructure.persistence.entity.NotificationHistoryEntity.StatusEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 通知历史JPA仓储
 */
@Repository
public interface JpaNotificationHistoryRepository extends JpaRepository<NotificationHistoryEntity, UUID> {

    List<NotificationHistoryEntity> findByRecipientUserId(UUID recipientUserId);

    List<NotificationHistoryEntity> findByTemplateCode(String templateCode);

    List<NotificationHistoryEntity> findByChannel(ChannelEntity channel);

    List<NotificationHistoryEntity> findByStatus(StatusEntity status);

    List<NotificationHistoryEntity> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT h FROM NotificationHistoryEntity h WHERE " +
           "(:recipientUserId IS NULL OR h.recipientUserId = :recipientUserId) AND " +
           "(:channel IS NULL OR h.channel = :channel) AND " +
           "(:status IS NULL OR h.status = :status) AND " +
           "(:startTime IS NULL OR h.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR h.createdAt <= :endTime) " +
           "ORDER BY h.createdAt DESC")
    List<NotificationHistoryEntity> findByConditions(
            @Param("recipientUserId") UUID recipientUserId,
            @Param("channel") ChannelEntity channel,
            @Param("status") StatusEntity status,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    @Query("SELECT COUNT(h) FROM NotificationHistoryEntity h WHERE " +
           "(:recipientUserId IS NULL OR h.recipientUserId = :recipientUserId) AND " +
           "(:channel IS NULL OR h.channel = :channel) AND " +
           "(:status IS NULL OR h.status = :status) AND " +
           "(:startTime IS NULL OR h.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR h.createdAt <= :endTime)")
    long countByConditions(
            @Param("recipientUserId") UUID recipientUserId,
            @Param("channel") ChannelEntity channel,
            @Param("status") StatusEntity status,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    long countByStatus(StatusEntity status);

    long countByChannel(ChannelEntity channel);
}

