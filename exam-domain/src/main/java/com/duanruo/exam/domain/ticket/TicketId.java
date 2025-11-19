package com.duanruo.exam.domain.ticket;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 准考证ID值对象
 */
public class TicketId extends BaseId {
    
    public TicketId(UUID value) {
        super(value);
    }
    
    public static TicketId of(UUID value) {
        return new TicketId(value);
    }
    
    public static TicketId generate() {
        return new TicketId(UUID.randomUUID());
    }
}

