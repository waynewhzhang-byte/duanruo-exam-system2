package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.NotificationTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 通知模板JPA仓储接口
 */
@Repository
public interface JpaNotificationTemplateRepository extends JpaRepository<NotificationTemplateEntity, UUID> {

    /**
     * 根据代码查找模板
     */
    Optional<NotificationTemplateEntity> findByCode(String code);

    /**
     * 根据渠道查找所有模板
     */
    List<NotificationTemplateEntity> findByChannel(NotificationTemplateEntity.ChannelEntity channel);

    /**
     * 根据状态查找所有模板
     */
    List<NotificationTemplateEntity> findByStatus(NotificationTemplateEntity.StatusEntity status);

    /**
     * 检查代码是否存在
     */
    boolean existsByCode(String code);
}

