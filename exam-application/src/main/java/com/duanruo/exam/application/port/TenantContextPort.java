package com.duanruo.exam.application.port;

import com.duanruo.exam.shared.domain.TenantId;

/**
 * 租户上下文端口接口
 * 用于在应用层获取当前租户信息，避免直接依赖基础设施层
 */
public interface TenantContextPort {
    
    /**
     * 获取当前请求的租户ID
     * @return 当前租户ID，如果没有租户上下文则返回null
     */
    TenantId getCurrentTenantId();
    
    /**
     * 检查是否存在租户上下文
     * @return true如果存在租户上下文，否则false
     */
    boolean hasTenantContext();
}

