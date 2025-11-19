package com.duanruo.exam.infrastructure.multitenancy;

import com.duanruo.exam.shared.domain.TenantId;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 租户上下文过滤器
 * 在所有Filter之前执行，提取租户ID并设置到TenantContext
 * 这样Hibernate在任何时候都能获取到正确的租户标识符
 */
@Component
@Order(1) // 确保在所有Filter之前执行
public class TenantContextFilter implements Filter {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantContextFilter.class);
    
    private static final String TENANT_HEADER_NAME = "X-Tenant-ID";
    private static final String DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        try {
            // 1. 提取租户ID
            String tenantIdStr = extractTenantId(httpRequest);
            if (tenantIdStr == null) {
                logger.debug("No tenant ID found in request, using default tenant");
                tenantIdStr = DEFAULT_TENANT_ID;
            }
            
            // 2. 立即设置租户上下文
            TenantId tenantId = TenantId.of(tenantIdStr);
            TenantContext.setCurrentTenant(tenantId);
            logger.debug("Tenant context set in filter for tenant: {}", tenantId);
            
            // 3. 继续过滤器链
            chain.doFilter(request, response);
            
        } catch (Exception e) {
            logger.error("Error in tenant context filter", e);
            httpResponse.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        } finally {
            // 4. 清除租户上下文
            TenantContext.clear();
            logger.debug("Tenant context cleared in filter");
        }
    }
    
    /**
     * 从请求中提取租户ID
     * 优先从Header获取，其次从URL路径提取
     */
    private String extractTenantId(HttpServletRequest request) {
        // 1. 从Header获取
        String tenantId = request.getHeader(TENANT_HEADER_NAME);
        if (tenantId != null && !tenantId.isBlank()) {
            logger.debug("Extracted tenant ID from header: {}", tenantId);
            return tenantId;
        }
        
        // 2. 从URL路径提取（例如：/api/v1/{tenantId}/exams）
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        
        // 移除context path
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }
        
        // 匹配 /{tenantId}/... 格式
        // 注意：这里假设租户ID是UUID格式
        String[] parts = path.split("/");
        if (parts.length >= 2) {
            String potentialTenantId = parts[1];
            // 简单验证是否是UUID格式
            if (potentialTenantId.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
                logger.debug("Extracted tenant ID from path: {}", potentialTenantId);
                return potentialTenantId;
            }
        }
        
        logger.debug("No tenant ID found in request");
        return null;
    }
}

