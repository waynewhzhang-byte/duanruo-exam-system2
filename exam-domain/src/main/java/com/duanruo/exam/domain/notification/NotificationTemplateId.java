package com.duanruo.exam.domain.notification;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 通知模板ID值对象
 */
public class NotificationTemplateId extends BaseId {

    public NotificationTemplateId(UUID value) {
        super(value);
    }

    public NotificationTemplateId(String value) {
        super(value);
    }

    public static NotificationTemplateId newNotificationTemplateId() {
        return new NotificationTemplateId(BaseId.newId());
    }

    public static NotificationTemplateId of(UUID value) {
        return new NotificationTemplateId(value);
    }

    public static NotificationTemplateId of(String value) {
        return new NotificationTemplateId(value);
    }
}

