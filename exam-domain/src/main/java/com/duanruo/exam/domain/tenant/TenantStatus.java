package com.duanruo.exam.domain.tenant;

/**
 * 租户状态枚举
 */
public enum TenantStatus {
    /**
     * 待激活
     */
    PENDING,
    
    /**
     * 激活状态
     */
    ACTIVE,
    
    /**
     * 停用状态
     */
    INACTIVE,
    
    /**
     * 已删除
     */
    DELETED
}

