package com.duanruo.exam.adapter.rest.security;

import com.duanruo.exam.domain.user.Permission;
import com.duanruo.exam.domain.user.Role;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 安全上下文工厂，用于创建带有角色和权限的测试用户
 */
public class WithMockUserWithPermissionsSecurityContextFactory 
        implements WithSecurityContextFactory<WithMockUserWithPermissions> {

    @Override
    public SecurityContext createSecurityContext(WithMockUserWithPermissions annotation) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        
        String username = annotation.username();
        String roleName = annotation.role();
        
        // 获取角色对应的权限
        Set<Permission> permissions = getRolePermissions(roleName);
        
        // 创建权限列表
        List<GrantedAuthority> authorities = new ArrayList<>();

        // 添加角色（带 ROLE_ 前缀，用于 hasRole() 检查）
        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));

        // 添加角色名称（不带前缀，用于 hasAuthority('CANDIDATE') 检查）
        authorities.add(new SimpleGrantedAuthority(roleName));

        // 添加权限（不带前缀，直接使用权限名称）
        authorities.addAll(permissions.stream()
                .map(p -> new SimpleGrantedAuthority(p.name()))
                .collect(Collectors.toList()));
        
        // 添加额外的权限
        for (String extraPermission : annotation.extraPermissions()) {
            authorities.add(new SimpleGrantedAuthority(extraPermission));
        }

        // 尝试将 username 解析为 UUID（用于 @CurrentUserId 注解）
        Object principal;
        try {
            principal = java.util.UUID.fromString(username);
        } catch (IllegalArgumentException e) {
            // 如果不是有效的 UUID，生成一个确定性的 UUID（基于 username 的哈希）
            // 这样可以确保相同的 username 总是生成相同的 UUID
            principal = generateDeterministicUUID(username);
        }

        // 创建认证对象
        Authentication auth = new UsernamePasswordAuthenticationToken(
                principal,
                "password",
                authorities
        );
        
        context.setAuthentication(auth);
        return context;
    }
    
    /**
     * 根据角色名称获取对应的权限集合
     */
    private Set<Permission> getRolePermissions(String roleName) {
        return switch (roleName) {
            case "SUPER_ADMIN", "ADMIN" -> Role.SUPER_ADMIN.getPermissions();
            case "TENANT_ADMIN" -> Role.TENANT_ADMIN.getPermissions();
            case "EXAM_ADMIN" -> Role.EXAM_ADMIN.getPermissions();
            case "PRIMARY_REVIEWER" -> Role.PRIMARY_REVIEWER.getPermissions();
            case "SECONDARY_REVIEWER" -> Role.SECONDARY_REVIEWER.getPermissions();
            case "CANDIDATE" -> Role.CANDIDATE.getPermissions();
            case "EXAMINER" -> Role.EXAMINER.getPermissions();
            default -> Set.of(); // 未知角色返回空权限集
        };
    }

    /**
     * 基于字符串生成确定性的 UUID
     * 使用 UUID v5 (基于 SHA-1 哈希)
     */
    private java.util.UUID generateDeterministicUUID(String name) {
        // 使用一个固定的命名空间 UUID
        java.util.UUID namespace = java.util.UUID.fromString("6ba7b810-9dad-11d1-80b4-00c04fd430c8");

        try {
            byte[] nameBytes = name.getBytes("UTF-8");
            byte[] namespaceBytes = toBytes(namespace);

            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
            md.update(namespaceBytes);
            md.update(nameBytes);
            byte[] hash = md.digest();

            // 使用前 16 字节创建 UUID
            hash[6] &= 0x0f;  // 清除版本位
            hash[6] |= 0x50;  // 设置版本为 5
            hash[8] &= 0x3f;  // 清除变体位
            hash[8] |= 0x80;  // 设置变体为 RFC 4122

            long msb = 0;
            long lsb = 0;
            for (int i = 0; i < 8; i++) {
                msb = (msb << 8) | (hash[i] & 0xff);
            }
            for (int i = 8; i < 16; i++) {
                lsb = (lsb << 8) | (hash[i] & 0xff);
            }

            return new java.util.UUID(msb, lsb);
        } catch (Exception e) {
            // 如果失败，返回一个基于 hashCode 的简单 UUID
            return new java.util.UUID(0, name.hashCode());
        }
    }

    /**
     * 将 UUID 转换为字节数组
     */
    private byte[] toBytes(java.util.UUID uuid) {
        byte[] bytes = new byte[16];
        long msb = uuid.getMostSignificantBits();
        long lsb = uuid.getLeastSignificantBits();
        for (int i = 0; i < 8; i++) {
            bytes[i] = (byte) (msb >>> (8 * (7 - i)));
        }
        for (int i = 8; i < 16; i++) {
            bytes[i] = (byte) (lsb >>> (8 * (7 - i)));
        }
        return bytes;
    }
}

