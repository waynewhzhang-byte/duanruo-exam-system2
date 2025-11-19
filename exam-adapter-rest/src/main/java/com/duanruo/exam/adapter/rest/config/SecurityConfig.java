package com.duanruo.exam.adapter.rest.config;

import com.duanruo.exam.adapter.rest.security.JwtAuthenticationEntryPoint;
import com.duanruo.exam.adapter.rest.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;

/**
 * Spring Security配置
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Value("${app.security.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${app.security.cors.allowed-methods}")
    private String allowedMethods;

    @Value("${app.security.cors.allowed-headers}")
    private String allowedHeaders;

    @Value("${app.security.cors.allow-credentials}")
    private boolean allowCredentials;

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.security.csrf.enabled:true}")
    private boolean csrfEnabled;

    public SecurityConfig(JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
                         JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        if (csrfEnabled) {
            http.csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                .ignoringRequestMatchers(
                    // 登录、注册等公开端点不需要CSRF保护（相对于 context-path）
                    "/auth/**",
                    // 健康检查和监控端点
                    "/actuator/**",
                    "/health/**",
                    // Swagger文档
                    "/swagger-ui/**",
                    "/v3/api-docs/**"
                )
            )
            // 添加CSRF Token到响应
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class);
        } else {
            http.csrf(AbstractHttpConfigurer::disable);
        }

        http
            // 配置CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 配置会话管理为无状态
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 配置异常处理
            .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            // 配置授权规则
            // 注意：只在这里配置真正需要公开的端点（无需认证）
            // 所有业务API的权限控制统一由Controller方法上的@PreAuthorize注解控制
            .authorizeHttpRequests(auth -> auth
                // 认证相关端点 - 公开
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/register").permitAll()
                .requestMatchers("/auth/bootstrap/create-initial-admin").permitAll()

                // 系统监控端点 - 公开
                .requestMatchers("/actuator/health/**").permitAll()

                // API文档端点 - 公开
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/swagger-ui.html").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()

                // CORS预检请求 - 公开
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 公开业务端点（这些端点没有@PreAuthorize注解，需要在这里配置）
                .requestMatchers(HttpMethod.GET, "/tenants/slug/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/positions/*/form-template").permitAll()
                .requestMatchers(HttpMethod.POST, "/payments/callback").permitAll()

                // 其他所有请求都需要认证
                // 具体的权限控制由Controller方法上的@PreAuthorize注解决定
                .anyRequest().authenticated()
            )

            // 添加JWT过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 设置允许的源（生产环境必须使用白名单）
        if ("*".equals(allowedOrigins)) {
            // 开发环境：允许所有源（使用AllowedOriginPatterns以支持credentials）
            configuration.setAllowedOriginPatterns(List.of("*"));
            // 生产环境警告
            if (isProductionEnvironment()) {
                throw new IllegalStateException(
                    "CORS配置错误：生产环境不允许使用通配符(*)作为allowed-origins。" +
                    "请在环境变量CORS_ALLOWED_ORIGINS中配置具体的域名白名单。"
                );
            }
        } else {
            // 生产环境：使用白名单
            List<String> origins = Arrays.asList(allowedOrigins.split(","));
            // 验证白名单格式
            validateOrigins(origins);
            configuration.setAllowedOrigins(origins);
        }

        // 设置允许的方法（限制为必要的方法）
        configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));

        // 设置允许的头
        if ("*".equals(allowedHeaders)) {
            // 允许所有头（仅开发环境）
            configuration.setAllowedHeaders(List.of("*"));
        } else {
            configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
        }

        // 设置暴露的响应头（允许前端访问）
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "X-Total-Count",
            "X-Page-Number",
            "X-Page-Size",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ));

        // 设置是否允许凭证（Cookie、Authorization头等）
        configuration.setAllowCredentials(allowCredentials);

        // 设置预检请求的缓存时间（1小时）
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    /**
     * 检查是否为生产环境
     */
    private boolean isProductionEnvironment() {
        String profile = System.getProperty("spring.profiles.active", "");
        return profile.contains("prod") || profile.contains("production");
    }

    /**
     * 验证CORS源白名单格式
     */
    private void validateOrigins(List<String> origins) {
        for (String origin : origins) {
            origin = origin.trim();

            // 检查是否为有效的URL格式
            if (!origin.matches("^https?://[a-zA-Z0-9.-]+(:[0-9]+)?$")) {
                throw new IllegalArgumentException(
                    "CORS配置错误：无效的origin格式 '" + origin + "'。" +
                    "正确格式示例：http://localhost:3000 或 https://example.com"
                );
            }

            // 生产环境必须使用HTTPS（localhost除外）
            if (isProductionEnvironment() && origin.startsWith("http://") && !origin.contains("localhost")) {
                throw new IllegalArgumentException(
                    "CORS配置错误：生产环境必须使用HTTPS。不安全的origin: " + origin
                );
            }
        }
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * SPA应用的CSRF Token请求处理器
     * 支持从请求头或请求参数中读取CSRF Token
     */
    static final class SpaCsrfTokenRequestHandler extends CsrfTokenRequestAttributeHandler {
        private final CsrfTokenRequestHandler delegate = new XorCsrfTokenRequestAttributeHandler();

        @Override
        public void handle(HttpServletRequest request, HttpServletResponse response,
                          Supplier<CsrfToken> csrfToken) {
            /*
             * 始终使用XorCsrfTokenRequestAttributeHandler来提供CSRF token作为请求属性，
             * 这样Spring Security可以在需要时验证token
             */
            this.delegate.handle(request, response, csrfToken);
        }

        @Override
        public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
            /*
             * 如果请求包含请求头（例如X-XSRF-TOKEN），优先使用该值。
             * 这是SPA应用的标准做法。
             */
            String headerValue = request.getHeader(csrfToken.getHeaderName());
            if (headerValue != null) {
                return headerValue;
            }

            /*
             * 否则，使用默认的解析逻辑（从请求参数中读取）
             */
            return this.delegate.resolveCsrfTokenValue(request, csrfToken);
        }
    }

    /**
     * CSRF Cookie过滤器
     * 确保每个响应都包含CSRF Token Cookie
     */
    static final class CsrfCookieFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                       FilterChain filterChain) throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
            // 触发token的延迟加载，确保cookie被设置
            if (csrfToken != null) {
                csrfToken.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }
}
