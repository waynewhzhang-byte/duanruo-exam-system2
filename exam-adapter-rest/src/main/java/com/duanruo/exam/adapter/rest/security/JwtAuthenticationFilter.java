package com.duanruo.exam.adapter.rest.security;

import com.duanruo.exam.application.service.JwtTokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT认证过滤器
 * 从请求头中提取JWT令牌并验证
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Autowired
    private JwtTokenService jwtTokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

        logger.info("=== JwtAuthenticationFilter called for path: {} ===", request.getRequestURI());

        try {
            String token = extractTokenFromRequest(request);
            logger.info("JWT Filter: Token extracted: {}", token != null ? "YES (length=" + token.length() + ")" : "NO");

            if (token == null) {
                logger.debug("No JWT token found in request to {}", request.getRequestURI());
            }

            if (token != null && jwtTokenService.validateToken(token)) {
                logger.info("JWT Filter: Token validated successfully");
                String userId = jwtTokenService.getUserIdFromToken(token);
                String username = jwtTokenService.getUsernameFromToken(token);
                List<String> roles = jwtTokenService.getRolesFromToken(token);
                List<String> permissions = jwtTokenService.getPermissionsFromToken(token);

                if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 创建权限列表（角色 + 权限）
                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                            .collect(java.util.stream.Collectors.toList());

                    // 添加权限（与系统的 hasAuthority('EXAM_CREATE') 等保持一致，取消 PERMISSION_ 前缀）
                    permissions.stream()
                            .map(SimpleGrantedAuthority::new)
                            .forEach(authorities::add);

                    logger.info("JWT Filter: Setting authorities for user {}: {}", userId, authorities);

                    // 将 Authentication 的 principal 设为 userId，方便业务侧按 UUID 使用；用户名放入 details
                    UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);

                    // 将用户名和userId放入 details，便于需要展示用户名的地方使用
                    var details = new java.util.HashMap<String, Object>();
                    details.put("userId", userId);  // 添加userId到details，供CurrentUserIdArgumentResolver使用
                    details.put("username", username);
                    details.put("ip", request.getRemoteAddr());
                    authentication.setDetails(details);

                    // 设置到安全上下文
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    logger.debug("Set authentication for userId: {} (username={}) with roles: {} and permissions: {}",
                               userId, username, roles, permissions);
                }
            } else if (token != null) {
                logger.debug("JWT token present but failed validation; path={}", request.getRequestURI());
            }
        } catch (Exception e) {
            logger.warn("JWT token validation failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 从请求中提取JWT令牌
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        // Prefer Authorization header
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        // Fallbacks for browser clients behind Next.js proxy: try cookies
        try {
            var cookies = request.getCookies();
            if (cookies != null) {
                String readable = null;
                String httpOnly = null;
                for (var c : cookies) {
                    if ("auth-token-readable".equals(c.getName()) && StringUtils.hasText(c.getValue())) {
                        readable = c.getValue();
                    } else if ("auth-token".equals(c.getName()) && StringUtils.hasText(c.getValue())) {
                        httpOnly = c.getValue();
                    }
                }
                // Prefer readable if present (many setups only forward non-httpOnly via proxies), otherwise httpOnly
                if (StringUtils.hasText(readable)) return readable;
                if (StringUtils.hasText(httpOnly)) return httpOnly;
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String ctx = request.getContextPath(); // e.g. "/api"
        String rel = path.startsWith(ctx) ? path.substring(ctx.length()) : path; // e.g. "/auth/register"

        logger.info("=== shouldNotFilter: path={}, ctx={}, rel={} ===", path, ctx, rel);

        // 跳过公开端点（使用相对于 context-path 的相对路径匹配）
        // 注意：/auth/admin/** 需要认证，不应跳过
        if (rel.equals("/auth/login") ||
            rel.equals("/auth/register") ||
            rel.equals("/auth/bootstrap/create-initial-admin") ||
            rel.startsWith("/public/") ||
            rel.equals("/actuator/health") ||
            rel.startsWith("/swagger-ui/") ||
            rel.startsWith("/v3/api-docs/") ||
            // 租户slug查询为公开端点，跳过JWT过滤
            rel.startsWith("/tenants/slug/")) {
            return true;
        }
        return false;
    }
}
