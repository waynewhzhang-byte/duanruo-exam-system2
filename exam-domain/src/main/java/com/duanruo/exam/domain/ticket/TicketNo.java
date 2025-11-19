package com.duanruo.exam.domain.ticket;

import java.util.Objects;

/**
 * 准考证号值对象
 */
public class TicketNo {
    
    private final String value;
    
    public TicketNo(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("准考证号不能为空");
        }
        this.value = value.trim();
    }
    
    public static TicketNo of(String value) {
        return new TicketNo(value);
    }
    
    public String getValue() {
        return value;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TicketNo ticketNo = (TicketNo) o;
        return Objects.equals(value, ticketNo.value);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(value);
    }
    
    @Override
    public String toString() {
        return value;
    }
}
