package com.duanruo.exam.shared.domain;

import java.util.UUID;

/**
 * 租户ID值对象
 * 用于多租户SAAS架构中标识租户
 */
public class TenantId extends ValueObject {
    
    private final UUID value;
    
    private TenantId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("TenantId cannot be null");
        }
        this.value = value;
    }
    
    public static TenantId of(UUID value) {
        return new TenantId(value);
    }
    
    public static TenantId of(String value) {
        try {
            return new TenantId(UUID.fromString(value));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid TenantId format: " + value, e);
        }
    }
    
    public static TenantId generate() {
        return new TenantId(UUID.randomUUID());
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

