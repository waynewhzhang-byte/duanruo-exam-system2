package com.duanruo.exam.shared.domain;

import java.util.Arrays;
import java.util.Objects;

/**
 * 值对象基类
 * 值对象是不可变的，通过值相等性进行比较
 */
public abstract class ValueObject {

    /**
     * 获取用于相等性比较的组件
     * 子类必须实现此方法，返回所有用于相等性比较的字段
     */
    protected abstract Object[] getEqualityComponents();

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        
        ValueObject other = (ValueObject) obj;
        return Arrays.equals(getEqualityComponents(), other.getEqualityComponents());
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(getEqualityComponents());
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{" +
                "components=" + Arrays.toString(getEqualityComponents()) +
                '}';
    }
}
