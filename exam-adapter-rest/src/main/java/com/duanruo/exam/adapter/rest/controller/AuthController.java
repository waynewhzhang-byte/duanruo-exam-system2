package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.application.service.AuthenticationService;
import com.duanruo.exam.domain.user.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import com.duanruo.exam.adapter.rest.security.CurrentUsername;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "认证管理", description = "用户认证相关接口")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationService authenticationService;

    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @Operation(summary = "用户登录", description = "用户登录获取JWT Token")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        logger.debug("Login request received for username: {}", request.getUsername());
        LoginResponse response = authenticationService.login(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "候选人注册", description = "候选人自助注册账号")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        // 验证密码确认
        if (!request.isPasswordConfirmed()) {
            return ResponseEntity.badRequest().build();
        }
        
        UserResponse response = authenticationService.registerCandidate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "刷新Token", description = "使用现有Token刷新获取新Token")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().build();
        }

        String token = authHeader.substring(7);
        LoginResponse response = authenticationService.refreshToken(token);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "选择租户", description = "用户选择租户后生成包含租户信息和租户特定角色的JWT Token")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden - 用户无权访问该租户", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/select-tenant")
    public ResponseEntity<LoginResponse> selectTenant(
            @Valid @RequestBody SelectTenantRequest request,
            @CurrentUserId java.util.UUID userId) {

        logger.info("User {} selecting tenant {}", userId, request.getTenantId());

        LoginResponse response = authenticationService.selectTenant(request, userId.toString());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "引导创建首个管理员", description = "仅当系统中无任何管理员时可用，需提供引导令牌")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/bootstrap/create-initial-admin")
    public ResponseEntity<UserResponse> createInitialAdmin(
            @RequestHeader(value = "X-Bootstrap-Token", required = false) String bootstrapToken,
            @Valid @RequestBody RegisterRequest request) {
        if (!request.isPasswordConfirmed()) {
            return ResponseEntity.badRequest().build();
        }
        UserResponse response = authenticationService.createInitialAdminIfNone(request, bootstrapToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "修改密码", description = "用户修改自己的密码")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @CurrentUsername String username) {

        authenticationService.changePassword(
                username,
                request.getOldPassword(),
                request.getNewPassword()
        );

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "创建管理员用户", description = "创建管理员账号")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/create-admin")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<UserResponse> createAdmin(@Valid @RequestBody RegisterRequest request) {
        if (!request.isPasswordConfirmed()) {
            return ResponseEntity.badRequest().build();
        }
        
        UserResponse response = authenticationService.createSystemUser(request, Set.of(Role.SUPER_ADMIN));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "创建一级审核员", description = "创建一级审核员账号")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/create-primary-reviewer")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<UserResponse> createPrimaryReviewer(@Valid @RequestBody RegisterRequest request) {
        if (!request.isPasswordConfirmed()) {
            return ResponseEntity.badRequest().build();
        }
        
        UserResponse response = authenticationService.createSystemUser(request, Set.of(Role.PRIMARY_REVIEWER));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "创建二级审核员", description = "创建二级审核员账号")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/create-secondary-reviewer")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<UserResponse> createSecondaryReviewer(@Valid @RequestBody RegisterRequest request) {
        if (!request.isPasswordConfirmed()) {
            return ResponseEntity.badRequest().build();
        }
        
        UserResponse response = authenticationService.createSystemUser(request, Set.of(Role.SECONDARY_REVIEWER));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "创建考官", description = "创建考官账号")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/create-examiner")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<UserResponse> createExaminer(@Valid @RequestBody RegisterRequest request) {
        if (!request.isPasswordConfirmed()) {
            return ResponseEntity.badRequest().build();
        }

        UserResponse response = authenticationService.createSystemUser(request, Set.of(Role.EXAMINER));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "创建租户管理员", description = "创建租户管理员账号")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/create-tenant-admin")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<UserResponse> createTenantAdmin(@Valid @RequestBody RegisterRequest request) {
        if (!request.isPasswordConfirmed()) {
            return ResponseEntity.badRequest().build();
        }

        UserResponse response = authenticationService.createSystemUser(request, Set.of(Role.TENANT_ADMIN));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "重置用户密码", description = "管理员重置用户密码")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/reset-password")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authenticationService.resetPassword(request.getUsername(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "激活用户", description = "管理员激活用户账号")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/activate/{username}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<Void> activateUser(@PathVariable String username) {
        authenticationService.activateUser(username);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "停用用户", description = "管理员停用用户账号")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/deactivate/{username}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<Void> deactivateUser(@PathVariable String username) {
        authenticationService.deactivateUser(username);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "锁定用户", description = "管理员锁定用户账号")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/admin/lock/{username}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<Void> lockUser(@PathVariable String username) {
        authenticationService.lockUser(username);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的详细信息")
    @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = com.duanruo.exam.application.dto.UserResponse.class)))
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@CurrentUserId java.util.UUID userId) {
        UserResponse resp = authenticationService.getUserProfile(userId.toString());
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "登出", description = "用户登出（客户端删除Token）")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // JWT是无状态的，登出主要由客户端处理
        // 这里可以记录登出日志或加入黑名单机制
        return ResponseEntity.ok().build();
    }

}
