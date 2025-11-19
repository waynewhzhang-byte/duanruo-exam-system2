package com.duanruo.exam.adapter.rest.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * CORS配置测试
 */
class CorsConfigTest {

    @Test
    @DisplayName("开发环境：允许多个本地源")
    void devEnvironment_AllowsMultipleLocalOrigins() {
        // Given
        SecurityConfig config = createSecurityConfig(
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002",
            "GET,POST,PUT,DELETE,OPTIONS",
            "*",
            true
        );

        // When
        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration corsConfig = source.getCorsConfiguration(new MockHttpServletRequest());

        // Then
        assertThat(corsConfig).isNotNull();
        assertThat(corsConfig.getAllowedOrigins()).containsExactlyInAnyOrder(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3002"
        );
        assertThat(corsConfig.getAllowedMethods()).containsExactlyInAnyOrder(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
        );
        assertThat(corsConfig.getAllowedHeaders()).contains("*");
        assertThat(corsConfig.getAllowCredentials()).isTrue();
        assertThat(corsConfig.getMaxAge()).isEqualTo(3600L);
    }

    @Test
    @DisplayName("生产环境：使用通配符应该抛出异常")
    void prodEnvironment_WildcardOrigin_ShouldThrowException() {
        // Given
        System.setProperty("spring.profiles.active", "prod");
        SecurityConfig config = createSecurityConfig(
            "*",
            "GET,POST,PUT,DELETE,OPTIONS",
            "*",
            true
        );
        
        try {
            // When & Then
            assertThatThrownBy(() -> config.corsConfigurationSource())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("生产环境不允许使用通配符");
        } finally {
            System.clearProperty("spring.profiles.active");
        }
    }

    @Test
    @DisplayName("生产环境：HTTP源应该抛出异常")
    void prodEnvironment_HttpOrigin_ShouldThrowException() {
        // Given
        System.setProperty("spring.profiles.active", "production");
        SecurityConfig config = createSecurityConfig(
            "http://exam.example.com",
            "GET,POST,PUT,DELETE,OPTIONS",
            "Authorization,Content-Type",
            true
        );
        
        try {
            // When & Then
            assertThatThrownBy(() -> config.corsConfigurationSource())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("生产环境必须使用HTTPS");
        } finally {
            System.clearProperty("spring.profiles.active");
        }
    }

    @Test
    @DisplayName("生产环境：HTTPS源应该成功")
    void prodEnvironment_HttpsOrigin_ShouldSucceed() {
        // Given
        System.setProperty("spring.profiles.active", "prod");
        SecurityConfig config = createSecurityConfig(
            "https://exam.example.com,https://admin.example.com",
            "GET,POST,PUT,DELETE,OPTIONS",
            "Authorization,Content-Type,X-Tenant-Id",
            true
        );

        try {
            // When
            CorsConfigurationSource source = config.corsConfigurationSource();
            CorsConfiguration corsConfig = source.getCorsConfiguration(new MockHttpServletRequest());

            // Then
            assertThat(corsConfig).isNotNull();
            assertThat(corsConfig.getAllowedOrigins()).containsExactlyInAnyOrder(
                "https://exam.example.com",
                "https://admin.example.com"
            );
            assertThat(corsConfig.getAllowedHeaders()).containsExactlyInAnyOrder(
                "Authorization", "Content-Type", "X-Tenant-Id"
            );
        } finally {
            System.clearProperty("spring.profiles.active");
        }
    }

    @Test
    @DisplayName("无效的源格式应该抛出异常")
    void invalidOriginFormat_ShouldThrowException() {
        // Given
        SecurityConfig config = createSecurityConfig(
            "exam.example.com",  // 缺少协议
            "GET,POST",
            "*",
            true
        );
        
        // When & Then
        assertThatThrownBy(() -> config.corsConfigurationSource())
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("无效的origin格式");
    }

    @Test
    @DisplayName("暴露的响应头应该包含必要的头")
    void exposedHeaders_ShouldIncludeNecessaryHeaders() {
        // Given
        SecurityConfig config = createSecurityConfig(
            "http://localhost:3000",
            "GET,POST",
            "*",
            true
        );

        // When
        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration corsConfig = source.getCorsConfiguration(new MockHttpServletRequest());

        // Then
        assertThat(corsConfig.getExposedHeaders()).containsExactlyInAnyOrder(
            "Authorization",
            "X-Total-Count",
            "X-Page-Number",
            "X-Page-Size",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        );
    }

    @Test
    @DisplayName("允许凭证时不能使用通配符源")
    void allowCredentials_WithWildcardOrigin_ShouldUseOriginPatterns() {
        // Given
        SecurityConfig config = createSecurityConfig(
            "*",
            "GET,POST",
            "*",
            true
        );

        // When
        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration corsConfig = source.getCorsConfiguration(new MockHttpServletRequest());

        // Then
        // 当使用通配符且allowCredentials=true时，应该使用AllowedOriginPatterns
        assertThat(corsConfig.getAllowedOriginPatterns()).contains("*");
        assertThat(corsConfig.getAllowCredentials()).isTrue();
    }

    @Test
    @DisplayName("生产环境：localhost应该允许HTTP")
    void prodEnvironment_LocalhostHttp_ShouldBeAllowed() {
        // Given
        System.setProperty("spring.profiles.active", "prod");
        SecurityConfig config = createSecurityConfig(
            "http://localhost:8080,https://exam.example.com",
            "GET,POST",
            "*",
            true
        );

        try {
            // When
            CorsConfigurationSource source = config.corsConfigurationSource();
            CorsConfiguration corsConfig = source.getCorsConfiguration(new MockHttpServletRequest());

            // Then
            assertThat(corsConfig.getAllowedOrigins()).containsExactlyInAnyOrder(
                "http://localhost:8080",
                "https://exam.example.com"
            );
        } finally {
            System.clearProperty("spring.profiles.active");
        }
    }

    @Test
    @DisplayName("预检请求缓存时间应该为1小时")
    void preflightMaxAge_ShouldBe1Hour() {
        // Given
        SecurityConfig config = createSecurityConfig(
            "http://localhost:3000",
            "GET,POST",
            "*",
            true
        );

        // When
        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration corsConfig = source.getCorsConfiguration(new MockHttpServletRequest());

        // Then
        assertThat(corsConfig.getMaxAge()).isEqualTo(3600L);
    }

    /**
     * 创建SecurityConfig实例用于测试
     */
    private SecurityConfig createSecurityConfig(
            String allowedOrigins,
            String allowedMethods,
            String allowedHeaders,
            boolean allowCredentials) {

        // 创建mock的依赖
        var jwtEntryPoint = new com.duanruo.exam.adapter.rest.security.JwtAuthenticationEntryPoint();
        var jwtFilter = new com.duanruo.exam.adapter.rest.security.JwtAuthenticationFilter();

        SecurityConfig config = new SecurityConfig(jwtEntryPoint, jwtFilter);

        // 使用反射设置私有字段
        ReflectionTestUtils.setField(config, "allowedOrigins", allowedOrigins);
        ReflectionTestUtils.setField(config, "allowedMethods", allowedMethods);
        ReflectionTestUtils.setField(config, "allowedHeaders", allowedHeaders);
        ReflectionTestUtils.setField(config, "allowCredentials", allowCredentials);

        return config;
    }
}

