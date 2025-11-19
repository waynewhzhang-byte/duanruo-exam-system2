package com.duanruo.exam.bootstrap.integration.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

@TestConfiguration
public class TestSecurityOverrides {
    @Bean
    @Primary
    public WebSecurityCustomizer webSecurityCustomizer() {
        // In tests, fully bypass Spring Security filter chain for auth endpoints
        return web -> web.ignoring().requestMatchers(
                "/auth/**",
                "/api/v1/auth/**"
        );
    }
}

