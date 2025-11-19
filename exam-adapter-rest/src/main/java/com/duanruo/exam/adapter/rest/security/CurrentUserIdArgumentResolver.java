package com.duanruo.exam.adapter.rest.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.MethodParameter;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.UUID;

public class CurrentUserIdArgumentResolver implements HandlerMethodArgumentResolver {

    private static final Logger logger = LoggerFactory.getLogger(CurrentUserIdArgumentResolver.class);

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUserId.class)
                && UUID.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("CurrentUserIdArgumentResolver: auth={}, principal={}, name={}",
            auth,
            auth != null ? auth.getPrincipal() : "null",
            auth != null ? auth.getName() : "null");

        if (auth == null) {
            logger.error("CurrentUserIdArgumentResolver: Authentication is null!");
            throw new AccessDeniedException("未认证，无法获取用户ID");
        }

        // 优先从 details 里取 userId（JwtAuthenticationFilter 已放入）
        String candidate = null;
        Object details = auth.getDetails();
        if (details instanceof java.util.Map<?, ?> map) {
            Object v = map.get("userId");
            if (v instanceof String s && !s.isBlank()) {
                candidate = s;
            }
        }

        // 其次尝试 principal，再退回到 name
        if (candidate == null) {
            Object principal = auth.getPrincipal();
            if (principal instanceof String s && !s.isBlank()) {
                candidate = s;
            } else if (auth.getName() != null && !auth.getName().isBlank()) {
                candidate = auth.getName();
            }
        }

        logger.info("CurrentUserIdArgumentResolver: candidate userId={}", candidate);

        try {
            UUID userId = UUID.fromString(candidate);
            logger.info("CurrentUserIdArgumentResolver: Successfully resolved userId={}", userId);
            return userId;
        } catch (Exception e) {
            logger.error("CurrentUserIdArgumentResolver: Failed to parse userId from candidate={}", candidate, e);
            throw new AccessDeniedException("无效的用户身份，无法解析用户ID");
        }
    }
}

