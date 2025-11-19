package com.duanruo.exam.domain.user;

import com.duanruo.exam.shared.domain.ValueObject;

import java.util.UUID;

/**
 * 用户ID值对象
 */
public class UserId extends ValueObject {
    
    private final UUID value;

    public UserId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        this.value = value;
    }

    public static UserId generate() {
        return new UserId(UUID.randomUUID());
    }

    public static UserId of(String value) {
        return new UserId(UUID.fromString(value));
    }

    public static UserId of(UUID value) {
        return new UserId(value);
    }

    public UUID getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value.toString();
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{value};
    }
}
