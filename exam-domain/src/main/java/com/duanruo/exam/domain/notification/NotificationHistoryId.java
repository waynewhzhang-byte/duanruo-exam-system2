package com.duanruo.exam.domain.notification;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 通知历史ID值对象
 */
public class NotificationHistoryId extends BaseId {

    public NotificationHistoryId(UUID value) {
        super(value);
    }

    public NotificationHistoryId(String value) {
        super(value);
    }

    public static NotificationHistoryId newNotificationHistoryId() {
        return new NotificationHistoryId(BaseId.newId());
    }

    public static NotificationHistoryId of(UUID value) {
        return new NotificationHistoryId(value);
    }

    public static NotificationHistoryId of(String value) {
        return new NotificationHistoryId(value);
    }
}

