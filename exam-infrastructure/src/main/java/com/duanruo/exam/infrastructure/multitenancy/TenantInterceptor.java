package com.duanruo.exam.infrastructure.multitenancy;

import com.duanruo.exam.domain.tenant.UserTenantRoleRepository;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import com.duanruo.exam.shared.domain.TenantId;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 租户拦截器
 * 验证用户是否有权限访问指定租户
 * 注意：租户上下文的设置已经在TenantContextFilter中完成
 */
@Component
public class TenantInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(TenantInterceptor.class);

    private static final String DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
    
    private final UserRepository userRepository;
    private final UserTenantRoleRepository userTenantRoleRepository;
    
    public TenantInterceptor(
            UserRepository userRepository,
            UserTenantRoleRepository userTenantRoleRepository) {
        this.userRepository = userRepository;
        this.userTenantRoleRepository = userTenantRoleRepository;
    }
    
    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {

        logger.info("=== TenantInterceptor.preHandle called for path: {} ===", request.getRequestURI());

        try {
            // 注意：租户上下文已经在TenantContextFilter中设置
            // 这里只负责验证用户是否有权限访问该租户

            // 1. 获取当前租户ID（从TenantContext）
            TenantId tenantId = TenantContext.getCurrentTenant();
            if (tenantId == null) {
                logger.warn("No tenant context found in interceptor");
                tenantId = TenantId.of(DEFAULT_TENANT_ID);
            }
            logger.info("Validating access for tenant: {}", tenantId);

            // 2. 对于某些端点，跳过租户权限检查（例如：/tenants/slug/{slug} 用于租户选择）
            if (shouldSkipTenantValidation(request)) {
                logger.debug("Skipping tenant validation for path: {}", request.getRequestURI());
                return true;
            }

            // 3. 获取当前用户
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                logger.debug("No authenticated user, skipping tenant validation");
                return true;
            }

            // 4. 验证用户权限
            // authentication.getName() 返回的是 userId (UUID字符串)
            String userIdStr = authentication.getName();
            if (userIdStr == null || "anonymousUser".equals(userIdStr)) {
                logger.debug("Anonymous user, skipping tenant validation");
                return true;
            }

            // 从principal获取userId
            UserId userId;
            try {
                userId = UserId.of(userIdStr);
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid user ID format: {}", userIdStr);
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid user ID");
                return false;
            }

            // 查找用户
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                logger.warn("User not found: {}", userId);
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "User not found");
                return false;
            }

            // 5. 检查权限
            if (isSuperAdmin(user)) {
                // 超级管理员可以访问任何租户
                logger.debug("Super admin {} accessing tenant {}", user.getUsername(), tenantId);
                return true;
            }

            // 6. 检查用户是否属于该租户
            logger.info("Checking tenant access: userId={} (type: {}), tenantId={} (type: {})",
                userId, userId.getClass().getName(),
                tenantId, tenantId.getClass().getName());
            logger.info("About to call userTenantRoleRepository.belongsToTenant()");
            boolean belongsToTenant = userTenantRoleRepository.belongsToTenant(userId, tenantId);
            logger.info("Tenant access check result: belongsToTenant={}", belongsToTenant);

            if (!belongsToTenant) {
                logger.warn("User {} (ID: {}) does not belong to tenant {} - DENYING ACCESS", user.getUsername(), userId, tenantId);
                // 直接写入403响应
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                String jsonResponse = String.format(
                    "{\"error\":\"Forbidden\",\"message\":\"Access denied: User does not belong to this tenant\",\"status\":403,\"timestamp\":\"%s\"}",
                    java.time.Instant.now().toString()
                );
                response.getWriter().write(jsonResponse);
                response.getWriter().flush();
                return false;
            }

            logger.info("Tenant validation successful for user {} and tenant {}", user.getUsername(), tenantId);
            return true;

        } catch (IllegalArgumentException e) {
            logger.error("Invalid tenant ID format", e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid tenant ID format");
            return false;
        } catch (Exception e) {
            logger.error("Error in tenant interceptor", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
            return false;
        }
    }
    
    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex) {
        // 租户上下文的清理已经在TenantContextFilter中完成
        // 这里不需要再次清理
    }
    
    /**
     * 检查用户是否为超级管理员
     */
    private boolean isSuperAdmin(User user) {
        return user.getRoles().contains(Role.SUPER_ADMIN);
    }

    /**
     * 判断路径是否应该跳过租户验证
     */
    private boolean shouldSkipTenantValidation(HttpServletRequest request) {
        String path = request.getRequestURI();

        // 统一去除 context-path 前缀，确保匹配逻辑与 Spring MVC 一致
        String ctx = request.getContextPath();
        String rel = (ctx != null && !ctx.isBlank() && path.startsWith(ctx)) ? path.substring(ctx.length()) : path;

        // 跳过认证相关的路径
        if (rel.startsWith("/auth/")) {
            return true;
        }

        // 跳过租户管理API（仅超级管理员可访问，在Controller层验证）
        if (rel.matches("/tenants/?$") || rel.matches("/tenants/[^/]+/?$") || rel.matches("/tenants/slug/[^/]+/?$")) {
            return true;
        }

        // 跳过健康检查等公共端点
        if (rel.startsWith("/actuator/") || rel.startsWith("/health")) {
            return true;
        }

        // 跳过公开考试API（考生查看考试信息和岗位列表）
        // 这些API允许考生在没有租户角色的情况下访问，以便首次报名
        if (rel.matches("/exams/[^/]+/?$") ||                    // GET /exams/{id}
            rel.matches("/exams/[^/]+/positions/?$") ||          // GET /exams/{id}/positions
            rel.matches("/exams/[^/]+/announcement/?$")) {       // GET /exams/{id}/announcement
            return true;
        }

        // 跳过报名提交API（考生首次报名时还没有租户角色）
        // 报名成功后会自动创建租户角色关联
        if (rel.matches("/applications/?$") && "POST".equals(request.getMethod())) {
            return true;
        }

        return false;
    }
}

