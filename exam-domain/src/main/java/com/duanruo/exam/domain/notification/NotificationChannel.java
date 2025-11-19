package com.duanruo.exam.domain.notification;

/**
 * 通知渠道枚举
 */
public enum NotificationChannel {
    EMAIL("email", "邮件"),
    SMS("sms", "短信"),
    IN_APP("in_app", "站内信");

    private final String code;
    private final String description;

    NotificationChannel(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static NotificationChannel fromCode(String code) {
        for (NotificationChannel channel : values()) {
            if (channel.code.equals(code)) {
                return channel;
            }
        }
        throw new IllegalArgumentException("Unknown notification channel code: " + code);
    }
}

