package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.dto.tenant.GrantRoleRequest;
import com.duanruo.exam.application.service.UserTenantRoleApplicationService;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import com.duanruo.exam.shared.domain.TenantId;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 用户租户角色管理REST API
 */
@RestController
@RequestMapping("/tenants/{tenantId}/users")
public class UserTenantRoleController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserTenantRoleController.class);
    
    private final UserTenantRoleApplicationService userTenantRoleApplicationService;
    private final UserRepository userRepository;
    
    public UserTenantRoleController(
            UserTenantRoleApplicationService userTenantRoleApplicationService,
            UserRepository userRepository) {
        this.userTenantRoleApplicationService = userTenantRoleApplicationService;
        this.userRepository = userRepository;
    }
    
    /**
     * 授予用户角色
     * 仅租户管理员或超级管理员可操作
     */
    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('TENANT_USER_MANAGE')")
    public ResponseEntity<Void> grantRole(
            @PathVariable UUID tenantId,
            @Valid @RequestBody GrantRoleRequest request) {
        
        logger.info("Granting role {} to user {} in tenant {}", 
            request.role(), request.userId(), tenantId);
        
        UUID currentUserId = getCurrentUserId();
        
        userTenantRoleApplicationService.grantRole(
            request.userId(),
            tenantId,
            request.role(),
            currentUserId
        );
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 撤销用户角色
     * 仅租户管理员或超级管理员可操作
     */
    @DeleteMapping("/{userId}/roles/{role}")
    @PreAuthorize("hasAuthority('TENANT_USER_MANAGE')")
    public ResponseEntity<Void> revokeRole(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @PathVariable Role role) {
        
        logger.info("Revoking role {} from user {} in tenant {}", role, userId, tenantId);
        
        UUID currentUserId = getCurrentUserId();
        
        userTenantRoleApplicationService.revokeRole(
            userId,
            tenantId,
            role,
            currentUserId
        );
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 获取用户在租户下的所有角色
     */
    @GetMapping("/{userId}/roles")
    public ResponseEntity<List<Role>> getUserRoles(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId) {
        
        logger.debug("Getting roles for user {} in tenant {}", userId, tenantId);
        
        List<Role> roles = userTenantRoleApplicationService.getUserRolesInTenant(userId, tenantId);
        
        return ResponseEntity.ok(roles);
    }
    
    /**
     * 获取租户下的所有用户ID
     */
    @GetMapping
    public ResponseEntity<List<UUID>> getTenantUsers(@PathVariable UUID tenantId) {
        logger.debug("Getting users in tenant {}", tenantId);
        
        List<UUID> userIds = userTenantRoleApplicationService.getTenantUsers(tenantId)
            .stream()
            .map(UserId::getValue)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(userIds);
    }
    
    /**
     * 获取租户下特定角色的所有用户
     */
    @GetMapping("/by-role/{role}")
    public ResponseEntity<List<UUID>> getTenantUsersByRole(
            @PathVariable UUID tenantId,
            @PathVariable Role role) {
        
        logger.debug("Getting users with role {} in tenant {}", role, tenantId);
        
        List<UUID> userIds = userTenantRoleApplicationService.getTenantUsersByRole(tenantId, role)
            .stream()
            .map(UserId::getValue)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(userIds);
    }
    
    /**
     * 移除用户在租户下的所有角色
     * 仅租户管理员或超级管理员可操作
     */
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('TENANT_USER_MANAGE')")
    public ResponseEntity<Void> removeUserFromTenant(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId) {
        
        logger.info("Removing user {} from tenant {}", userId, tenantId);
        
        userTenantRoleApplicationService.removeUserFromTenant(userId, tenantId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 获取当前用户的所有租户
     */
    @GetMapping("/me/tenants")
    public ResponseEntity<List<UUID>> getMyTenants() {
        UUID currentUserId = getCurrentUserId();
        
        logger.debug("Getting tenants for current user: {}", currentUserId);
        
        List<UUID> tenantIds = userTenantRoleApplicationService.getUserTenants(currentUserId)
            .stream()
            .map(TenantId::getValue)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(tenantIds);
    }
    
    /**
     * 获取当前登录用户的ID
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Current user not found"));
        
        return user.getId().getValue();
    }
}

