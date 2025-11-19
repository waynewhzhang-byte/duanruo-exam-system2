package com.duanruo.exam.shared.event;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 领域事件基类
 */
public abstract class DomainEvent {
    
    private final UUID eventId;
    private final LocalDateTime occurredAt;
    private final String aggregateType;
    private final UUID aggregateId;
    
    protected DomainEvent(String aggregateType, UUID aggregateId) {
        this.eventId = UUID.randomUUID();
        this.occurredAt = LocalDateTime.now();
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
    }
    
    public UUID getEventId() {
        return eventId;
    }
    
    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }
    
    public String getAggregateType() {
        return aggregateType;
    }
    
    public UUID getAggregateId() {
        return aggregateId;
    }
    
    public abstract String getEventType();
}
