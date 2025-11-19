package com.duanruo.exam.infrastructure.multitenancy;

import com.duanruo.exam.shared.domain.TenantId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 租户上下文管理器
 * 使用ThreadLocal存储当前请求的租户信息
 */
public class TenantContext {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantContext.class);
    
    private static final ThreadLocal<TenantId> currentTenant = new ThreadLocal<>();
    
    /**
     * 设置当前租户
     */
    public static void setCurrentTenant(TenantId tenantId) {
        if (tenantId == null) {
            logger.warn("Attempting to set null tenant ID");
            return;
        }
        logger.debug("Setting current tenant: {}", tenantId);
        currentTenant.set(tenantId);
    }
    
    /**
     * 获取当前租户
     */
    public static TenantId getCurrentTenant() {
        TenantId tenantId = currentTenant.get();
        if (tenantId == null) {
            logger.warn("No tenant context found in current thread");
        }
        return tenantId;
    }
    
    /**
     * 获取当前租户ID（字符串格式）
     */
    public static String getCurrentTenantId() {
        TenantId tenantId = getCurrentTenant();
        return tenantId != null ? tenantId.toString() : null;
    }
    
    /**
     * 检查是否存在租户上下文
     */
    public static boolean hasTenantContext() {
        return currentTenant.get() != null;
    }
    
    /**
     * 清除当前租户上下文
     * 必须在请求结束时调用，防止内存泄漏
     */
    public static void clear() {
        TenantId tenantId = currentTenant.get();
        if (tenantId != null) {
            logger.debug("Clearing tenant context: {}", tenantId);
        }
        currentTenant.remove();
    }
}

