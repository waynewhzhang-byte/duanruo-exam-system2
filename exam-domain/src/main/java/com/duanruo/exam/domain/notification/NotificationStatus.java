package com.duanruo.exam.domain.notification;

/**
 * 通知状态枚举
 */
public enum NotificationStatus {
    PENDING("pending", "待发送"),
    SENDING("sending", "发送中"),
    SUCCESS("success", "发送成功"),
    FAILED("failed", "发送失败");

    private final String code;
    private final String description;

    NotificationStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static NotificationStatus fromCode(String code) {
        for (NotificationStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown notification status code: " + code);
    }
}

