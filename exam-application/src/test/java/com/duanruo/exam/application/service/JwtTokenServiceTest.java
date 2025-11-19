package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenServiceTest {

    private User buildUser(String username) {
        return new User(
                UserId.of(UUID.randomUUID()),
                username,
                username + "@example.com",
                "$2a$10$hash",
                "Test User",
                Set.of(Role.CANDIDATE)
        );
    }

    @Test
    void generateAndParseToken_withShortSecret_shouldWork() {
        // short secret triggers SHA-512 derivation in JwtTokenService
        JwtTokenService svc = new JwtTokenService("short", 3600, "test-issuer");
        User user = buildUser("alice");

        String token = svc.generateToken(user);
        assertThat(token).isNotBlank();
        assertThat(svc.validateToken(token)).isTrue();

        String username = svc.getUsernameFromToken(token);
        assertThat(username).isEqualTo("alice");

        List<String> roles = svc.getRolesFromToken(token);
        assertThat(roles).contains("CANDIDATE");

        List<String> perms = svc.getPermissionsFromToken(token);
        assertThat(perms).isNotNull();

        Map<String, Object> info = svc.extractUserInfo(token);
        assertThat(info.get("username")).isEqualTo("alice");
        @SuppressWarnings("unchecked")
        List<String> infoRoles = (List<String>) info.get("roles");
        assertThat(infoRoles).contains("CANDIDATE");
    }

    @Test
    void validateToken_withMismatchedUsername_shouldBeFalse() {
        JwtTokenService svc = new JwtTokenService("another-short", 3600, "issuer");
        User user = buildUser("bob");
        String token = svc.generateToken(user);

        assertThat(svc.validateToken(token, "alice")).isFalse();
        assertThat(svc.validateToken(token, "bob")).isTrue();
    }

    @Test
    void expiredToken_shouldBeDetected() throws InterruptedException {
        // 0s expiration: immediately expired
        JwtTokenService svc = new JwtTokenService("short", 0, "issuer");
        String token = svc.generateToken(buildUser("eve"));

        // tiny delay to ensure system clock advances beyond issuedAt
        Thread.sleep(5);
        assertThat(svc.isTokenExpired(token)).isTrue();
        assertThat(svc.validateToken(token)).isFalse();
    }
}

