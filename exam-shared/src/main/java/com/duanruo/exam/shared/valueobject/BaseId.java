package com.duanruo.exam.shared.valueobject;

import java.util.Objects;
import java.util.UUID;

/**
 * ID值对象基类
 */
public abstract class BaseId {
    
    private final UUID value;
    
    protected BaseId(UUID value) {
        this.value = Objects.requireNonNull(value, "ID value cannot be null");
    }
    
    protected BaseId(String value) {
        this.value = UUID.fromString(Objects.requireNonNull(value, "ID value cannot be null"));
    }
    
    public static UUID newId() {
        return UUID.randomUUID();
    }
    
    public UUID getValue() {
        return value;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BaseId baseId = (BaseId) o;
        return Objects.equals(value, baseId.value);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(value);
    }
    
    @Override
    public String toString() {
        return value.toString();
    }
}
