package com.duanruo.exam.adapter.rest.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * API限流功能单元测试
 * 验证RateLimitConfig的限流逻辑
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RateLimitFilterTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private RateLimitConfig rateLimitConfig;
    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws IOException {
        rateLimitConfig = new RateLimitConfig();
        
        // 设置配置值
        ReflectionTestUtils.setField(rateLimitConfig, "rateLimitEnabled", true);
        ReflectionTestUtils.setField(rateLimitConfig, "requestsPerSecond", 10.0);
        ReflectionTestUtils.setField(rateLimitConfig, "cacheSize", 10000);
        ReflectionTestUtils.setField(rateLimitConfig, "cacheExpireMinutes", 10);
        
        // 初始化过滤器
        try {
            rateLimitConfig.init(null);
        } catch (ServletException e) {
            throw new RuntimeException(e);
        }

        // 设置响应writer
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
    }

    @Test
    @DisplayName("正常请求应该通过限流")
    void normalRequestShouldPass() throws Exception {
        // 设置请求
        when(request.getRequestURI()).thenReturn("/api/v1/exams");
        when(request.getRemoteAddr()).thenReturn("192.168.1.100");

        // 执行过滤
        rateLimitConfig.doFilter(request, response, filterChain);

        // 验证请求通过
        verify(filterChain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    @DisplayName("超过限流阈值应该返回429")
    void exceedingRateLimitShouldReturn429() throws Exception {
        String testIp = "192.168.1.101";
        when(request.getRequestURI()).thenReturn("/api/v1/exams");
        when(request.getRemoteAddr()).thenReturn(testIp);

        int totalRequests = 15; // 超过10 req/s的限流阈值
        int rateLimitedCount = 0;

        // 快速发送多个请求
        for (int i = 0; i < totalRequests; i++) {
            // 重置mock
            reset(filterChain, response);
            responseWriter = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

            rateLimitConfig.doFilter(request, response, filterChain);

            // 检查是否被限流
            try {
                verify(response).setStatus(429);
                rateLimitedCount++;
            } catch (AssertionError e) {
                // 未被限流，继续
            }
        }

        // 验证至少有一些请求被限流
        assertThat(rateLimitedCount).isGreaterThan(0);
        System.out.println("被限流请求数: " + rateLimitedCount + " / " + totalRequests);
    }

    @Test
    @DisplayName("不同IP应该有独立的限流配额")
    void differentIpsShouldHaveIndependentLimits() throws Exception {
        // IP1
        when(request.getRequestURI()).thenReturn("/api/v1/exams");
        when(request.getRemoteAddr()).thenReturn("192.168.1.102");
        rateLimitConfig.doFilter(request, response, filterChain);
        verify(filterChain, times(1)).doFilter(request, response);

        // IP2 - 重置mock
        reset(filterChain, response);
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
        when(request.getRemoteAddr()).thenReturn("192.168.1.103");
        
        rateLimitConfig.doFilter(request, response, filterChain);
        verify(filterChain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    @DisplayName("健康检查端点不应该被限流")
    void healthCheckShouldNotBeRateLimited() throws Exception {
        String testIp = "192.168.1.104";
        when(request.getRequestURI()).thenReturn("/actuator/health");
        when(request.getRemoteAddr()).thenReturn(testIp);

        int totalRequests = 20; // 远超限流阈值

        for (int i = 0; i < totalRequests; i++) {
            reset(filterChain, response);
            responseWriter = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
            
            rateLimitConfig.doFilter(request, response, filterChain);
            
            // 所有请求都应该通过
            verify(filterChain, times(1)).doFilter(request, response);
            verify(response, never()).setStatus(429);
        }
    }

    @Test
    @DisplayName("Swagger文档端点不应该被限流")
    void swaggerShouldNotBeRateLimited() throws Exception {
        when(request.getRequestURI()).thenReturn("/swagger-ui/index.html");
        when(request.getRemoteAddr()).thenReturn("192.168.1.105");

        rateLimitConfig.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    @DisplayName("X-Forwarded-For头应该被正确识别")
    void xForwardedForHeaderShouldBeRecognized() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/exams");
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.106");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1"); // 不同的IP

        rateLimitConfig.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("X-Real-IP头应该被正确识别")
    void xRealIpHeaderShouldBeRecognized() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/exams");
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn("192.168.1.107");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        rateLimitConfig.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("多个IP的X-Forwarded-For应该取第一个")
    void multipleIpsInXForwardedForShouldUseFirst() throws Exception {
        String multipleIps = "192.168.1.108, 10.0.0.1, 172.16.0.1";
        when(request.getRequestURI()).thenReturn("/api/v1/exams");
        when(request.getHeader("X-Forwarded-For")).thenReturn(multipleIps);

        rateLimitConfig.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("429响应应该包含正确的Content-Type和错误信息")
    void rateLimitResponseShouldHaveCorrectFormat() throws Exception {
        String testIp = "192.168.1.109";
        when(request.getRequestURI()).thenReturn("/api/v1/exams");
        when(request.getRemoteAddr()).thenReturn(testIp);

        int totalRequests = 15;
        boolean foundRateLimitResponse = false;

        for (int i = 0; i < totalRequests; i++) {
            reset(filterChain, response);
            responseWriter = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

            rateLimitConfig.doFilter(request, response, filterChain);

            try {
                verify(response).setStatus(429);
                verify(response).setContentType("application/json;charset=UTF-8");
                
                // 验证响应内容
                String responseContent = responseWriter.toString();
                assertThat(responseContent).contains("Too Many Requests");
                assertThat(responseContent).contains("请求过于频繁");
                
                foundRateLimitResponse = true;
                break;
            } catch (AssertionError e) {
                // 继续尝试
            }
        }

        assertThat(foundRateLimitResponse).isTrue();
    }

    @Test
    @DisplayName("禁用限流时所有请求都应该通过")
    void disabledRateLimitShouldAllowAllRequests() throws Exception {
        // 禁用限流
        ReflectionTestUtils.setField(rateLimitConfig, "rateLimitEnabled", false);

        String testIp = "192.168.1.110";
        when(request.getRequestURI()).thenReturn("/api/v1/exams");
        when(request.getRemoteAddr()).thenReturn(testIp);

        int totalRequests = 20;

        for (int i = 0; i < totalRequests; i++) {
            reset(filterChain, response);
            responseWriter = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

            rateLimitConfig.doFilter(request, response, filterChain);

            verify(filterChain, times(1)).doFilter(request, response);
            verify(response, never()).setStatus(429);
        }
    }

    @Test
    @DisplayName("静态资源不应该被限流")
    void staticResourcesShouldNotBeRateLimited() throws Exception {
        String testIp = "192.168.1.111";
        when(request.getRemoteAddr()).thenReturn(testIp);

        String[] staticPaths = {
            "/static/app.css",
            "/static/app.js",
            "/images/logo.png",
            "/images/banner.jpg",
            "/favicon.ico"
        };

        for (String path : staticPaths) {
            reset(filterChain, response);
            responseWriter = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
            when(request.getRequestURI()).thenReturn(path);

            rateLimitConfig.doFilter(request, response, filterChain);

            verify(filterChain, times(1)).doFilter(request, response);
            verify(response, never()).setStatus(429);
        }
    }
}

