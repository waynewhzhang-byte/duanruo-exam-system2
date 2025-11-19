package com.duanruo.exam.adapter.rest.security;

import org.springframework.security.core.Authentication;

import java.util.UUID;

public final class SecurityUtils {
    private SecurityUtils() {}

    public static UUID currentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }
        return UUID.fromString(authentication.getName());
    }

    @SuppressWarnings("unchecked")
    public static String currentUsername(Authentication authentication) {
        if (authentication == null) return null;
        Object details = authentication.getDetails();
        if (details instanceof java.util.Map<?, ?> map) {
            Object v = map.get("username");
            if (v instanceof String s && !s.isBlank()) return s;
        }
        return null;
    }
}

