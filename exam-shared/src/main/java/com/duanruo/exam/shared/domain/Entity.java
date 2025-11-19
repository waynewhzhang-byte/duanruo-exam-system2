package com.duanruo.exam.shared.domain;

import java.util.Objects;

/**
 * 实体基类
 * 实体通过唯一标识符进行识别，具有生命周期
 */
public abstract class Entity<T> {

    private T id;

    protected Entity() {
        // 用于ORM框架
    }

    protected Entity(T id) {
        this.id = id;
    }

    /**
     * 获取实体ID
     */
    public T getId() {
        return id;
    }

    /**
     * 设置实体ID（仅供框架使用）
     */
    protected void setId(T id) {
        this.id = id;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        
        Entity<?> other = (Entity<?>) obj;
        
        // 如果ID为null，则使用引用相等性
        if (id == null) {
            return false;
        }
        
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : super.hashCode();
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{" +
                "id=" + id +
                '}';
    }
}
