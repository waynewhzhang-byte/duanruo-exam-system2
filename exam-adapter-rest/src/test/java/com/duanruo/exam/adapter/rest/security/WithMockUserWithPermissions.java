package com.duanruo.exam.adapter.rest.security;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

/**
 * 自定义注解，用于在测试中模拟带有权限的用户
 * 
 * 使用示例：
 * @WithMockUserWithPermissions(username = "user1", role = "CANDIDATE")
 * @WithMockUserWithPermissions(username = "admin1", role = "ADMIN")
 * @WithMockUserWithPermissions(username = "reviewer1", role = "PRIMARY_REVIEWER")
 */
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockUserWithPermissionsSecurityContextFactory.class)
public @interface WithMockUserWithPermissions {
    
    /**
     * 用户名（通常是 UUID 字符串）
     */
    String username() default "test-user";
    
    /**
     * 角色名称（不需要 ROLE_ 前缀）
     * 支持的角色：CANDIDATE, ADMIN, PRIMARY_REVIEWER, SECONDARY_REVIEWER, EXAM_ADMIN, TENANT_ADMIN
     */
    String role() default "CANDIDATE";
    
    /**
     * 额外的权限（可选）
     */
    String[] extraPermissions() default {};
}

