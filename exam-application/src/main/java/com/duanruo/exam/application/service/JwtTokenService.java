package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.shared.domain.TenantId;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * JWT Token服务
 */
@Service
public class JwtTokenService {

    private final SecretKey secretKey;
    private final long expirationTime;
    private final String issuer;

    public JwtTokenService(
            @Value("${app.security.jwt.secret:${jwt.secret:exam-registration-system-secret-key-2024}}") String secret,
            @Value("${app.security.jwt.expiration:${jwt.expiration:86400}}") long expirationTime,
            @Value("${app.security.jwt.issuer:${jwt.issuer:exam-registration-system}}") String issuer) {
        this.secretKey = buildSecretKey(secret);
        this.expirationTime = expirationTime * 1000; // 转换为毫秒
        this.issuer = issuer;
    }

    /**
     * 生成JWT Token（全局角色）
     */
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("username", user.getUsername());
        claims.put("email", user.getEmail());
        claims.put("fullName", user.getFullName());
        claims.put("roles", user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList()));
        claims.put("permissions", user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Enum::name)
                .distinct()
                .collect(Collectors.toList()));
        claims.put("status", user.getStatus().name());

        return createToken(claims, user.getUsername());
    }

    /**
     * 生成租户特定的JWT Token
     * @param userId 用户ID
     * @param username 用户名
     * @param email 用户邮箱
     * @param fullName 用户全名
     * @param tenantId 租户ID
     * @param roles 用户在该租户下的所有角色（全局角色 + 租户角色）
     * @param status 用户状态
     * @return JWT Token
     */
    public String generateTenantToken(
            String userId,
            String username,
            String email,
            String fullName,
            String tenantId,
            Set<Role> roles,
            String status) {

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("email", email);
        claims.put("fullName", fullName);
        claims.put("tenantId", tenantId);  // ✅ 包含租户ID

        // ✅ 使用合并后的角色（全局角色 + 租户角色）
        claims.put("roles", roles.stream()
                .map(Role::getName)
                .collect(Collectors.toList()));

        // ✅ 使用合并后角色的权限
        claims.put("permissions", roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Enum::name)
                .distinct()
                .collect(Collectors.toList()));

        claims.put("status", status);

        return createToken(claims, username);
    }

    /**
     * 从Token中获取租户ID
     */
    public String getTenantIdFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("tenantId", String.class));
    }

    /**
     * 创建Token
     */
    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuer(issuer)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
    }

    private SecretKey buildSecretKey(String secret) {
        try {
            // 支持 base64: 前缀直接解码
            if (secret != null && secret.startsWith("base64:")) {
                String b64 = secret.substring("base64:".length());
                byte[] keyBytes = java.util.Base64.getDecoder().decode(b64);
                return Keys.hmacShaKeyFor(keyBytes);
            }
            byte[] raw = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            // HS512 需要 >= 64 字节的密钥；不足则通过 SHA-512 派生为 512bit
            if (raw.length < 64) {
                java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-512");
                byte[] digest = md.digest(raw); // 64字节
                return Keys.hmacShaKeyFor(digest);
            }
            return Keys.hmacShaKeyFor(raw);
        } catch (Exception e) {
            // 兜底：生成强随机密钥（仅开发环境场景），避免应用无法启动
            return Keys.secretKeyFor(SignatureAlgorithm.HS512);
        }
    }

    /**
     * 从Token中获取用户名
     */
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    /**
     * 从Token中获取用户ID
     */
    public String getUserIdFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("userId", String.class));
    }

    /**
     * 从Token中获取角色列表
     */
    @SuppressWarnings("unchecked")
    public java.util.List<String> getRolesFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("roles", java.util.List.class));
    }

    /**
     * 从Token中获取权限列表
     */
    @SuppressWarnings("unchecked")
    public java.util.List<String> getPermissionsFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("permissions", java.util.List.class));
    }

    /**
     * 从Token中获取过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    /**
     * 从Token中获取指定声明
     */
    public <T> T getClaimFromToken(String token, java.util.function.Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    /**
     * 从Token中获取所有声明
     */
    private Claims getAllClaimsFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException | IllegalArgumentException e) {
            throw new RuntimeException("无效的JWT Token", e);
        }
    }

    /**
     * 检查Token是否过期
     */
    public Boolean isTokenExpired(String token) {
        try {
            final Date expiration = getExpirationDateFromToken(token);
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * 验证Token
     */
    public Boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * 验证Token是否属于指定用户
     */
    public Boolean validateToken(String token, String username) {
        try {
            final String tokenUsername = getUsernameFromToken(token);
            return (username.equals(tokenUsername) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 获取Token过期时间（秒）
     */
    public long getExpirationTime() {
        return expirationTime / 1000;
    }

    /**
     * 获取Token剩余有效时间（秒）
     */
    public long getRemainingTime(String token) {
        try {
            Date expiration = getExpirationDateFromToken(token);
            long remaining = expiration.getTime() - System.currentTimeMillis();
            return Math.max(0, remaining / 1000);
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * 检查Token是否即将过期（30分钟内）
     */
    public boolean isTokenExpiringSoon(String token) {
        try {
            long remaining = getRemainingTime(token);
            return remaining > 0 && remaining < 1800; // 30分钟
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 从Token中提取用户信息摘要
     */
    public Map<String, Object> extractUserInfo(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("userId", claims.get("userId"));
            userInfo.put("username", claims.getSubject());
            userInfo.put("email", claims.get("email"));
            userInfo.put("fullName", claims.get("fullName"));
            userInfo.put("roles", claims.get("roles"));
            userInfo.put("permissions", claims.get("permissions"));
            userInfo.put("status", claims.get("status"));
            userInfo.put("issuedAt", claims.getIssuedAt());
            userInfo.put("expiresAt", claims.getExpiration());
            return userInfo;
        } catch (Exception e) {
            throw new RuntimeException("无法提取用户信息", e);
        }
    }
}
