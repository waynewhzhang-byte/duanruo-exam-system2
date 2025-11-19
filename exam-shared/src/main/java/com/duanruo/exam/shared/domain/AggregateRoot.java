package com.duanruo.exam.shared.domain;

import com.duanruo.exam.shared.event.DomainEvent;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 聚合根基类
 * 聚合根是领域模型中的根实体，负责维护聚合的一致性
 */
public abstract class AggregateRoot<T> extends Entity<T> {

    private final List<DomainEvent> domainEvents = new ArrayList<>();

    protected AggregateRoot() {
        super();
    }

    protected AggregateRoot(T id) {
        super(id);
    }

    /**
     * 添加领域事件
     */
    protected void addDomainEvent(DomainEvent event) {
        domainEvents.add(event);
    }

    /**
     * 移除领域事件
     */
    protected void removeDomainEvent(DomainEvent event) {
        domainEvents.remove(event);
    }

    /**
     * 清空领域事件
     */
    public void clearDomainEvents() {
        domainEvents.clear();
    }

    /**
     * 获取领域事件列表（只读）
     */
    public List<DomainEvent> getDomainEvents() {
        return Collections.unmodifiableList(domainEvents);
    }

    /**
     * 检查是否有领域事件
     */
    public boolean hasDomainEvents() {
        return !domainEvents.isEmpty();
    }
}
