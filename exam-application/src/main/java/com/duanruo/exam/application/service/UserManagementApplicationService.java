package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.CreateTenantUserRequest;
import com.duanruo.exam.application.dto.CreateUserRequest;
import com.duanruo.exam.application.dto.UserResponse;
import com.duanruo.exam.domain.tenant.UserTenantRole;
import com.duanruo.exam.domain.tenant.UserTenantRoleRepository;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import com.duanruo.exam.shared.domain.TenantId;
import com.duanruo.exam.shared.exception.ApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * 用户管理应用服务
 * 处理用户创建、角色分配等功能
 */
@Service
public class UserManagementApplicationService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserManagementApplicationService.class);
    
    private final UserRepository userRepository;
    private final UserTenantRoleRepository userTenantRoleRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserManagementApplicationService(
            UserRepository userRepository,
            UserTenantRoleRepository userTenantRoleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userTenantRoleRepository = userTenantRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    /**
     * SUPER_ADMIN创建用户
     * 可以创建任何角色的用户，包括TENANT_ADMIN
     * 
     * @param request 创建用户请求
     * @param createdBy 创建者ID（SUPER_ADMIN）
     * @return 用户响应
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request, UUID createdBy) {
        logger.info("SUPER_ADMIN creating user: {}", request.getUsername());
        
        // 1. 验证用户名和邮箱唯一性
        validateUserUniqueness(request.getUsername(), request.getEmail());
        
        // 2. 确定全局角色（如果未指定，默认为CANDIDATE）
        Set<Role> globalRoles = request.getGlobalRoles();
        if (globalRoles == null || globalRoles.isEmpty()) {
            globalRoles = Set.of(Role.CANDIDATE);
        }
        
        // 3. 创建用户
        UserId userId = UserId.generate();
        String passwordHash = passwordEncoder.encode(request.getPassword());
        
        User user = new User(
                userId,
                request.getUsername(),
                request.getEmail(),
                passwordHash,
                request.getFullName(),
                globalRoles
        );
        
        // 设置可选字段
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getJobTitle() != null) {
            user.setJobTitle(request.getJobTitle());
        }
        
        // 4. 保存用户
        userRepository.save(user);
        
        logger.info("User created successfully: userId={}, username={}, globalRoles={}", 
                userId, request.getUsername(), globalRoles);
        
        // 5. 如果指定了租户ID和租户角色，创建UserTenantRole关联
        if (request.getTenantId() != null && request.getTenantRole() != null) {
            TenantId tenantId = TenantId.of(UUID.fromString(request.getTenantId()));
            
            // 验证租户角色（不能是SUPER_ADMIN）
            if (request.getTenantRole() == Role.SUPER_ADMIN) {
                throw new ApplicationException("SUPER_ADMIN不能作为租户角色分配");
            }
            
            UserTenantRole userTenantRole = UserTenantRole.create(
                    userId,
                    tenantId,
                    request.getTenantRole(),
                    createdBy
            );
            
            userTenantRoleRepository.save(userTenantRole);
            
            logger.info("UserTenantRole created: userId={}, tenantId={}, role={}", 
                    userId, tenantId, request.getTenantRole());
        }
        
        return UserResponse.fromUser(user);
    }
    
    /**
     * TENANT_ADMIN在租户内创建用户
     * 只能创建租户级角色（PRIMARY_REVIEWER, SECONDARY_REVIEWER, CANDIDATE）
     * 
     * @param tenantId 租户ID
     * @param request 创建租户用户请求
     * @param createdBy 创建者ID（TENANT_ADMIN）
     * @return 用户响应
     */
    @Transactional
    public UserResponse createTenantUser(UUID tenantId, CreateTenantUserRequest request, UUID createdBy) {
        logger.info("TENANT_ADMIN creating user in tenant {}: {}", tenantId, request.getUsername());
        
        // 1. 验证租户角色
        validateTenantRole(request.getTenantRole());
        
        // 2. 验证用户名和邮箱唯一性
        validateUserUniqueness(request.getUsername(), request.getEmail());
        
        // 3. 创建用户（全局角色默认为CANDIDATE）
        UserId userId = UserId.generate();
        String passwordHash = passwordEncoder.encode(request.getPassword());
        
        User user = new User(
                userId,
                request.getUsername(),
                request.getEmail(),
                passwordHash,
                request.getFullName(),
                Set.of(Role.CANDIDATE)  // 租户内创建的用户全局角色默认为CANDIDATE
        );
        
        // 设置可选字段
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getJobTitle() != null) {
            user.setJobTitle(request.getJobTitle());
        }
        
        // 4. 保存用户
        userRepository.save(user);
        
        logger.info("User created successfully: userId={}, username={}", userId, request.getUsername());
        
        // 5. 创建UserTenantRole关联
        TenantId tenantIdObj = TenantId.of(tenantId);
        UserTenantRole userTenantRole = UserTenantRole.create(
                userId,
                tenantIdObj,
                request.getTenantRole(),
                createdBy
        );
        
        userTenantRoleRepository.save(userTenantRole);
        
        logger.info("UserTenantRole created: userId={}, tenantId={}, role={}", 
                userId, tenantId, request.getTenantRole());
        
        return UserResponse.fromUser(user);
    }
    
    /**
     * 为现有用户添加租户角色
     * 用于CANDIDATE用户参与多个租户的考试
     * 
     * @param userId 用户ID
     * @param tenantId 租户ID
     * @param role 租户角色
     * @param grantedBy 授予者ID
     */
    @Transactional
    public void addUserToTenant(UUID userId, UUID tenantId, Role role, UUID grantedBy) {
        logger.info("Adding user {} to tenant {} with role {}", userId, tenantId, role);
        
        // 1. 验证用户存在
        UserId userIdObj = UserId.of(userId);
        User user = userRepository.findById(userIdObj)
                .orElseThrow(() -> new ApplicationException("用户不存在: " + userId));
        
        // 2. 验证租户角色
        validateTenantRole(role);
        
        // 3. 检查是否已有该角色
        TenantId tenantIdObj = TenantId.of(tenantId);
        boolean hasRole = userTenantRoleRepository.hasRole(userIdObj, tenantIdObj, role);
        if (hasRole) {
            throw new ApplicationException("用户已在该租户下拥有该角色");
        }
        
        // 4. 创建UserTenantRole关联
        UserTenantRole userTenantRole = UserTenantRole.create(
                userIdObj,
                tenantIdObj,
                role,
                grantedBy
        );
        
        userTenantRoleRepository.save(userTenantRole);
        
        logger.info("User added to tenant successfully: userId={}, tenantId={}, role={}", 
                userId, tenantId, role);
    }
    
    /**
     * 验证用户名和邮箱唯一性
     */
    private void validateUserUniqueness(String username, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new ApplicationException("用户名已存在: " + username);
        }
        
        if (userRepository.existsByEmail(email)) {
            throw new ApplicationException("邮箱已被注册: " + email);
        }
    }
    
    /**
     * 验证租户角色
     * 租户角色不能是SUPER_ADMIN
     */
    private void validateTenantRole(Role role) {
        if (role == Role.SUPER_ADMIN) {
            throw new ApplicationException("SUPER_ADMIN不能作为租户角色分配");
        }
        
        // 可以进一步限制只允许特定角色
        Set<Role> allowedTenantRoles = Set.of(
                Role.TENANT_ADMIN,
                Role.PRIMARY_REVIEWER,
                Role.SECONDARY_REVIEWER,
                Role.EXAM_ADMIN,
                Role.EXAMINER,
                Role.CANDIDATE
        );
        
        if (!allowedTenantRoles.contains(role)) {
            throw new ApplicationException("不支持的租户角色: " + role);
        }
    }
}

