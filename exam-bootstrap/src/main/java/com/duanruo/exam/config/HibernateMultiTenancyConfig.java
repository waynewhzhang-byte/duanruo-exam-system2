package com.duanruo.exam.config;

import com.duanruo.exam.infrastructure.multitenancy.TenantIdentifierResolver;
import com.duanruo.exam.infrastructure.multitenancy.TenantSchemaConnectionProvider;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Hibernate多租户配置
 * 将Spring管理的Bean注入到Hibernate配置中
 */
@Configuration
public class HibernateMultiTenancyConfig {
    
    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer(
            TenantSchemaConnectionProvider connectionProvider,
            TenantIdentifierResolver tenantIdentifierResolver) {

        return (Map<String, Object> hibernateProperties) -> {
            hibernateProperties.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER, connectionProvider);
            hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, tenantIdentifierResolver);
        };
    }
}

