package com.duanruo.exam.domain.shared;

/**
 * 值对象标记接口
 * 
 * 在DDD中，值对象是不可变的，通过值而不是身份来定义的对象
 * 值对象应该实现equals和hashCode方法
 */
public interface ValueObject {
    
    // 标记接口，不需要方法定义
    // 实现类应该：
    // 1. 是不可变的（immutable）
    // 2. 重写equals()和hashCode()方法
    // 3. 基于值而不是身份进行比较
}
