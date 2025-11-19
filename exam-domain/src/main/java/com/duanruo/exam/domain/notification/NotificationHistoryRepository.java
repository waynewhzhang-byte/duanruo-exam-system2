package com.duanruo.exam.domain.notification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 通知历史仓储接口
 */
public interface NotificationHistoryRepository {

    /**
     * 保存通知历史
     */
    void save(NotificationHistory history);

    /**
     * 根据ID查找
     */
    Optional<NotificationHistory> findById(NotificationHistoryId id);

    /**
     * 根据接收人用户ID查找
     */
    List<NotificationHistory> findByRecipientUserId(UUID userId);

    /**
     * 根据模板代码查找
     */
    List<NotificationHistory> findByTemplateCode(String templateCode);

    /**
     * 根据渠道查找
     */
    List<NotificationHistory> findByChannel(NotificationChannel channel);

    /**
     * 根据状态查找
     */
    List<NotificationHistory> findByStatus(NotificationStatus status);

    /**
     * 根据时间范围查找
     */
    List<NotificationHistory> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据多个条件查找（分页）
     */
    List<NotificationHistory> findByConditions(
            UUID recipientUserId,
            NotificationChannel channel,
            NotificationStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int page,
            int size);

    /**
     * 统计总数
     */
    long countByConditions(
            UUID recipientUserId,
            NotificationChannel channel,
            NotificationStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime);

    /**
     * 统计各状态的数量
     */
    long countByStatus(NotificationStatus status);

    /**
     * 统计各渠道的数量
     */
    long countByChannel(NotificationChannel channel);

    /**
     * 查找所有
     */
    List<NotificationHistory> findAll();

    /**
     * 删除
     */
    void delete(NotificationHistoryId id);
}

