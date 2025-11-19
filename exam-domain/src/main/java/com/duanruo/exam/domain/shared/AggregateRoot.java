package com.duanruo.exam.domain.shared;

/**
 * 聚合根标记接口
 * 
 * 在DDD中，聚合根是聚合的唯一入口点，负责维护聚合的一致性
 */
public interface AggregateRoot<ID> {
    
    /**
     * 获取聚合根的唯一标识
     * 
     * @return 聚合根ID
     */
    ID getId();
}
