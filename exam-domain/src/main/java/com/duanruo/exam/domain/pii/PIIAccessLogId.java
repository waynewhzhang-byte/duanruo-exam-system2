package com.duanruo.exam.domain.pii;

import com.duanruo.exam.shared.domain.ValueObject;

import java.util.UUID;

/**
 * PII访问日志ID值对象
 *
 * @author Augment Agent
 * @since 2025-01-XX
 */
public class PIIAccessLogId extends ValueObject {

    private final UUID value;

    private PIIAccessLogId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("PIIAccessLogId cannot be null");
        }
        this.value = value;
    }

    public static PIIAccessLogId of(UUID value) {
        return new PIIAccessLogId(value);
    }

    public static PIIAccessLogId of(String value) {
        return new PIIAccessLogId(UUID.fromString(value));
    }

    public UUID getValue() {
        return value;
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{value};
    }

    @Override
    public String toString() {
        return value.toString();
    }
}

