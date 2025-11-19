package com.duanruo.exam.adapter.rest.config;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.google.common.util.concurrent.RateLimiter;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

/**
 * API限流配置
 * 使用Guava RateLimiter实现基于IP的限流
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitConfig implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitConfig.class);

    @Value("${app.security.rate-limit.enabled:false}")
    private boolean rateLimitEnabled;

    @Value("${app.security.rate-limit.requests-per-second:10}")
    private double requestsPerSecond;

    @Value("${app.security.rate-limit.cache-size:10000}")
    private int cacheSize;

    @Value("${app.security.rate-limit.cache-expire-minutes:10}")
    private int cacheExpireMinutes;

    // IP -> RateLimiter 缓存
    private LoadingCache<String, RateLimiter> rateLimiterCache;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // 初始化限流器缓存
        rateLimiterCache = CacheBuilder.newBuilder()
                .maximumSize(cacheSize)
                .expireAfterAccess(cacheExpireMinutes, TimeUnit.MINUTES)
                .build(new CacheLoader<String, RateLimiter>() {
                    @Override
                    public RateLimiter load(String key) {
                        return RateLimiter.create(requestsPerSecond);
                    }
                });
        
        logger.info("Rate limit filter initialized: enabled={}, requestsPerSecond={}", 
                    rateLimitEnabled, requestsPerSecond);
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (!rateLimitEnabled) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // 获取客户端IP
        String clientIp = getClientIp(httpRequest);
        
        // 排除健康检查和静态资源
        String path = httpRequest.getRequestURI();
        if (isExcludedPath(path)) {
            chain.doFilter(request, response);
            return;
        }

        try {
            // 获取该IP的限流器
            RateLimiter rateLimiter = rateLimiterCache.get(clientIp);
            
            // 尝试获取许可
            if (rateLimiter.tryAcquire()) {
                // 允许请求通过
                chain.doFilter(request, response);
            } else {
                // 超过限流，返回429
                logger.warn("Rate limit exceeded for IP: {}, path: {}", clientIp, path);
                httpResponse.setStatus(429);
                httpResponse.setContentType("application/json;charset=UTF-8");
                httpResponse.getWriter().write(
                    "{\"error\":\"Too Many Requests\",\"message\":\"请求过于频繁，请稍后再试\"}"
                );
            }
        } catch (ExecutionException e) {
            logger.error("Error getting rate limiter for IP: {}", clientIp, e);
            // 出错时允许请求通过，避免影响正常业务
            chain.doFilter(request, response);
        }
    }

    /**
     * 获取客户端真实IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        
        // 处理多个IP的情况，取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        
        return ip;
    }

    /**
     * 判断是否是排除路径
     */
    private boolean isExcludedPath(String path) {
        return path.contains("/actuator/health") ||
               path.contains("/swagger-ui") ||
               path.contains("/v3/api-docs") ||
               path.endsWith(".css") ||
               path.endsWith(".js") ||
               path.endsWith(".png") ||
               path.endsWith(".jpg") ||
               path.endsWith(".ico");
    }

    @Override
    public void destroy() {
        if (rateLimiterCache != null) {
            rateLimiterCache.invalidateAll();
        }
    }
}

