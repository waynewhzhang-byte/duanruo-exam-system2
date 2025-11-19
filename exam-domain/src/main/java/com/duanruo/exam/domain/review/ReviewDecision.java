package com.duanruo.exam.domain.review;

/**
 * 审核决定枚举
 */
public enum ReviewDecision {
    /**
     * 审核通过
     */
    APPROVED,
    
    /**
     * 审核拒绝
     */
    REJECTED,
    
    /**
     * 退回修改
     */
    RETURNED,
    
    /**
     * 待审核（初始状态）
     */
    PENDING
}

