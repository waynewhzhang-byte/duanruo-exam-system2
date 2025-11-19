package com.duanruo.exam.infrastructure.adapter;

import com.duanruo.exam.application.port.TenantContextPort;
import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import com.duanruo.exam.shared.domain.TenantId;
import org.springframework.stereotype.Component;

/**
 * 租户上下文适配器
 * 实现TenantContextPort接口，桥接应用层和基础设施层
 */
@Component
public class TenantContextAdapter implements TenantContextPort {
    
    @Override
    public TenantId getCurrentTenantId() {
        return TenantContext.getCurrentTenant();
    }
    
    @Override
    public boolean hasTenantContext() {
        return TenantContext.hasTenantContext();
    }
}

