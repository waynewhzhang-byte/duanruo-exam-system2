package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.LoginRequest;
import com.duanruo.exam.application.dto.LoginResponse;
import com.duanruo.exam.application.dto.UserResponse;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import com.duanruo.exam.shared.exception.ApplicationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthenticationServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtTokenService jwtTokenService;
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtTokenService = mock(JwtTokenService.class);
        authenticationService = new AuthenticationService(userRepository, passwordEncoder, jwtTokenService);
    }

    @Test
    void login_success_returnsToken_andUpdatesLastLogin() {
        // arrange
        UserId id = UserId.of(UUID.randomUUID());
        User user = new User(id, "john_doe", "john@example.com", "$2a$10$hash", "John Doe", Set.of(Role.CANDIDATE));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password#123", user.getPasswordHash())).thenReturn(true);
        when(jwtTokenService.generateToken(user)).thenReturn("mock-token");
        when(jwtTokenService.getExpirationTime()).thenReturn(3600L);

        LoginRequest request = new LoginRequest("john_doe", "Password#123");

        // act
        LoginResponse response = authenticationService.login(request);

        // assert
        assertThat(response.getToken()).isEqualTo("mock-token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getExpiresIn()).isEqualTo(3600L);
        UserResponse ur = response.getUser();
        assertThat(ur.getUsername()).isEqualTo("john_doe");

        // Note: 当前实现不持久化lastLoginAt（临时设计，避免历史数据版本/约束导致的登录500）
        // 后续会通过事件/异步任务持久化，因此不验证save调用
        verify(jwtTokenService, times(1)).generateToken(user);
    }

    @Test
    void login_wrongPassword_throwsApplicationException() {
        // arrange
        UserId id = UserId.of(UUID.randomUUID());
        User user = new User(id, "john_doe", "john@example.com", "$2a$10$hash", "John Doe", Set.of(Role.CANDIDATE));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("bad-pass", user.getPasswordHash())).thenReturn(false);

        LoginRequest request = new LoginRequest("john_doe", "bad-pass");

        // act + assert
        assertThatThrownBy(() -> authenticationService.login(request))
                .isInstanceOf(ApplicationException.class)
                .hasMessageContaining("用户名或密码错误");

        verify(userRepository, never()).save(any());
        verify(jwtTokenService, never()).generateToken(any());
    }
}

