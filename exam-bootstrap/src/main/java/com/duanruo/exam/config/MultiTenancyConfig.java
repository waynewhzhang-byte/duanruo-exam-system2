package com.duanruo.exam.config;

import com.duanruo.exam.infrastructure.multitenancy.TenantInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 多租户配置
 * 注册租户拦截器
 */
@Configuration
public class MultiTenancyConfig implements WebMvcConfigurer {
    
    private final TenantInterceptor tenantInterceptor;
    
    public MultiTenancyConfig(TenantInterceptor tenantInterceptor) {
        this.tenantInterceptor = tenantInterceptor;
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor)
                .addPathPatterns("/**")         // 拦截所有请求（context path已经是/api/v1）
                .excludePathPatterns(
                        "/auth/**",             // 排除认证相关接口
                        "/actuator/**",         // 排除监控端点
                        "/health/**"            // 排除健康检查
                )
                .order(1);  // 设置拦截器优先级
    }
}

