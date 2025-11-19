package com.duanruo.exam.domain.notification;

/**
 * 模板状态枚举
 */
public enum TemplateStatus {
    ACTIVE("active", "激活"),
    INACTIVE("inactive", "停用");

    private final String code;
    private final String description;

    TemplateStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static TemplateStatus fromCode(String code) {
        for (TemplateStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown template status code: " + code);
    }
}

