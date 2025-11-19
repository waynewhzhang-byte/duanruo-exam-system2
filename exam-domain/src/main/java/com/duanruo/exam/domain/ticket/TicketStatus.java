package com.duanruo.exam.domain.ticket;

/**
 * 准考证状态枚举
 */
public enum TicketStatus {
    
    /**
     * 已发放
     */
    ISSUED("已发放"),
    
    /**
     * 已打印
     */
    PRINTED("已打印"),
    
    /**
     * 已验证
     */
    VERIFIED("已验证"),
    
    /**
     * 已取消
     */
    CANCELLED("已取消");
    
    private final String description;
    
    TicketStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * 检查是否可以转换到目标状态
     */
    public boolean canTransitionTo(TicketStatus target) {
        if (this == CANCELLED) {
            return false; // 已取消的准考证不能转换到其他状态
        }
        
        return switch (this) {
            case ISSUED -> target == PRINTED || target == VERIFIED || target == CANCELLED;
            case PRINTED -> target == VERIFIED || target == CANCELLED;
            case VERIFIED -> target == CANCELLED;
            case CANCELLED -> false;
        };
    }
    
    /**
     * 检查是否是终态
     */
    public boolean isTerminal() {
        return this == CANCELLED;
    }
}

