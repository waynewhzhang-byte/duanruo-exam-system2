package com.duanruo.exam.domain.notification;

import java.util.List;
import java.util.Optional;

/**
 * 通知模板仓储接口
 */
public interface NotificationTemplateRepository {

    /**
     * 保存通知模板
     */
    void save(NotificationTemplate template);

    /**
     * 根据ID查找通知模板
     */
    Optional<NotificationTemplate> findById(NotificationTemplateId id);

    /**
     * 根据代码查找通知模板
     */
    Optional<NotificationTemplate> findByCode(String code);

    /**
     * 根据渠道查找所有模板
     */
    List<NotificationTemplate> findByChannel(NotificationChannel channel);

    /**
     * 根据状态查找所有模板
     */
    List<NotificationTemplate> findByStatus(TemplateStatus status);

    /**
     * 查找所有模板
     */
    List<NotificationTemplate> findAll();

    /**
     * 检查代码是否存在
     */
    boolean existsByCode(String code);

    /**
     * 删除通知模板
     */
    void delete(NotificationTemplateId id);
}

