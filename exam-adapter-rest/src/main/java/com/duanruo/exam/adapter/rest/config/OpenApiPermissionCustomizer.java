package com.duanruo.exam.adapter.rest.config;

import io.swagger.v3.oas.models.Operation;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.method.HandlerMethod;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Add x-permissions OpenAPI extension to each operation based on @PreAuthorize.
 * This keeps the contract in sync with code and allows CI linting.
 */
@Configuration
public class OpenApiPermissionCustomizer {

    private static final Pattern HAS_AUTHORITY = Pattern.compile("hasAuthority\\('([^']+)'\\)");
    private static final Pattern HAS_ANY_AUTHORITY = Pattern.compile("hasAnyAuthority\\(([^)]*)\\)");

    @Bean
    public OperationCustomizer permissionOperationCustomizer() {
        return new OperationCustomizer() {
            @Override
            public Operation customize(Operation operation, HandlerMethod handlerMethod) {
                Method method = handlerMethod.getMethod();
                PreAuthorize pre = method.getAnnotation(PreAuthorize.class);
                if (pre == null) {
                    // also check on class level
                    pre = handlerMethod.getBeanType().getAnnotation(PreAuthorize.class);
                }
                if (pre != null) {
                    List<String> permissions = extractPermissions(pre.value());
                    if (!permissions.isEmpty()) {
                        // Add extension: x-permissions: ["A","B"]
                        operation.addExtension("x-permissions", permissions);
                    }
                }
                return operation;
            }
        };
    }

    public static List<String> extractPermissions(String spel) {
        List<String> result = new ArrayList<>();
        // hasAuthority('X')
        Matcher m = HAS_AUTHORITY.matcher(spel);
        while (m.find()) {
            result.add(m.group(1));
        }
        // hasAnyAuthority('A','B', ...)
        Matcher any = HAS_ANY_AUTHORITY.matcher(spel);
        while (any.find()) {
            String args = any.group(1);
            Arrays.stream(args.split(","))
                    .map(String::trim)
                    .map(s -> s.replace("'", ""))
                    .filter(s -> !s.isEmpty())
                    .forEach(result::add);
        }
        // de-duplicate
        return result.stream().distinct().toList();
    }
}

