package com.duanruo.exam.shared.pii;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * PII（个人身份信息）字段标记注解
 * 用于标记需要脱敏处理的敏感字段
 * 
 * 使用示例：
 * <pre>
 * public class UserDTO {
 *     @PIIField(type = PIIType.NAME)
 *     private String name;
 *     
 *     @PIIField(type = PIIType.ID_CARD)
 *     private String idCard;
 *     
 *     @PIIField(type = PIIType.PHONE)
 *     private String phone;
 *     
 *     @PIIField(type = PIIType.EMAIL)
 *     private String email;
 * }
 * </pre>
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface PIIField {
    
    /**
     * PII字段类型
     */
    PIIType type();
    
    /**
     * 是否需要审计访问
     * 默认为true，表示访问此字段时需要记录审计日志
     */
    boolean audit() default true;
    
    /**
     * 允许查看完整数据的角色
     * 默认为空数组，表示所有角色都只能看到脱敏数据
     * 可以指定特定角色（如 SUPER_ADMIN, TENANT_ADMIN）可以查看完整数据
     */
    String[] allowedRoles() default {};
}

