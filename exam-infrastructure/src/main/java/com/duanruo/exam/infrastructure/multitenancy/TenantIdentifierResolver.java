package com.duanruo.exam.infrastructure.multitenancy;

import com.duanruo.exam.shared.domain.TenantId;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 租户标识符解析器
 * 从TenantContext中获取当前租户标识符
 */
@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantIdentifierResolver.class);
    private static final String DEFAULT_TENANT = "public";
    
    @Override
    public String resolveCurrentTenantIdentifier() {
        TenantId tenantId = TenantContext.getCurrentTenant();

        if (tenantId == null) {
            logger.debug("No tenant context found, using default tenant");
            return DEFAULT_TENANT;
        }

        String identifier = tenantId.getValue().toString();
        logger.debug("Resolved tenant identifier: {}", identifier);
        return identifier;
    }
    
    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}

