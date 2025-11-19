package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import com.duanruo.exam.application.dto.CreateTenantUserRequest;
import com.duanruo.exam.application.dto.CreateUserRequest;
import com.duanruo.exam.application.dto.UserResponse;
import com.duanruo.exam.application.service.UserManagementApplicationService;
import com.duanruo.exam.domain.user.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 用户管理REST API
 * 处理用户创建、角色分配等功能
 */
@RestController
@Tag(name = "用户管理", description = "用户创建和角色管理API")
public class UserManagementController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserManagementController.class);
    
    private final UserManagementApplicationService userManagementService;
    
    public UserManagementController(UserManagementApplicationService userManagementService) {
        this.userManagementService = userManagementService;
    }
    
    /**
     * SUPER_ADMIN创建用户
     * 可以创建任何角色的用户，包括TENANT_ADMIN
     */
    @Operation(
        summary = "创建用户（超级管理员）",
        description = "超级管理员创建用户，可以指定全局角色和租户角色"
    )
    @ApiResponse(responseCode = "201", description = "创建成功")
    @ApiResponse(responseCode = "400", description = "请求参数错误")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping("/admin/users")
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @CurrentUserId UUID currentUserId) {
        
        logger.info("SUPER_ADMIN {} creating user: {}", currentUserId, request.getUsername());
        
        UserResponse response = userManagementService.createUser(request, currentUserId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * TENANT_ADMIN在租户内创建用户
     * 只能创建租户级角色（PRIMARY_REVIEWER, SECONDARY_REVIEWER, CANDIDATE）
     */
    @Operation(
        summary = "创建租户用户（租户管理员）",
        description = "租户管理员在租户内创建用户（审核员、候选人等）"
    )
    @ApiResponse(responseCode = "201", description = "创建成功")
    @ApiResponse(responseCode = "400", description = "请求参数错误")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping("/{tenantId}/users")
    @PreAuthorize("hasAuthority('USER_CREATE_TENANT')")
    public ResponseEntity<UserResponse> createTenantUser(
            @Parameter(description = "租户ID", required = true)
            @PathVariable UUID tenantId,
            @Valid @RequestBody CreateTenantUserRequest request,
            @CurrentUserId UUID currentUserId) {
        
        logger.info("TENANT_ADMIN {} creating user in tenant {}: {}", 
                currentUserId, tenantId, request.getUsername());
        
        UserResponse response = userManagementService.createTenantUser(tenantId, request, currentUserId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 为现有用户添加租户角色
     * 用于CANDIDATE用户参与多个租户的考试
     */
    @Operation(
        summary = "添加用户到租户",
        description = "为现有用户添加租户角色，用于用户参与多个租户的考试"
    )
    @ApiResponse(responseCode = "200", description = "添加成功")
    @ApiResponse(responseCode = "400", description = "请求参数错误")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping("/{tenantId}/users/{userId}/roles")
    @PreAuthorize("hasAuthority('USER_TENANT_ROLE_GRANT')")
    public ResponseEntity<Void> addUserToTenant(
            @Parameter(description = "租户ID", required = true)
            @PathVariable UUID tenantId,
            @Parameter(description = "用户ID", required = true)
            @PathVariable UUID userId,
            @Parameter(description = "租户角色", required = true)
            @RequestParam Role role,
            @CurrentUserId UUID currentUserId) {
        
        logger.info("Adding user {} to tenant {} with role {}", userId, tenantId, role);
        
        userManagementService.addUserToTenant(userId, tenantId, role, currentUserId);
        
        return ResponseEntity.ok().build();
    }
}

