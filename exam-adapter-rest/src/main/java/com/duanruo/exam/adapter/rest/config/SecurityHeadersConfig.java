package com.duanruo.exam.adapter.rest.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import java.io.IOException;

/**
 * 安全响应头配置
 * 添加各种安全相关的HTTP响应头
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersConfig implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // X-Content-Type-Options: 防止MIME类型嗅探
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");
        
        // X-Frame-Options: 防止点击劫持
        httpResponse.setHeader("X-Frame-Options", "DENY");
        
        // X-XSS-Protection: 启用浏览器XSS过滤
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");
        
        // Strict-Transport-Security: 强制使用HTTPS（生产环境）
        // 注意：仅在HTTPS环境下启用
        // httpResponse.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        
        // Content-Security-Policy: 内容安全策略
        httpResponse.setHeader("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'");
        
        // Referrer-Policy: 控制Referer头信息
        httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        
        // Permissions-Policy: 控制浏览器功能
        httpResponse.setHeader("Permissions-Policy", 
            "geolocation=(), " +
            "microphone=(), " +
            "camera=(), " +
            "payment=(), " +
            "usb=()");
        
        // Cache-Control: 敏感数据不缓存
        if (request instanceof jakarta.servlet.http.HttpServletRequest) {
            String path = ((jakarta.servlet.http.HttpServletRequest) request).getRequestURI();
            if (path.contains("/auth/") || path.contains("/admin/")) {
                httpResponse.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
                httpResponse.setHeader("Pragma", "no-cache");
                httpResponse.setHeader("Expires", "0");
            }
        }
        
        chain.doFilter(request, response);
    }
}

