package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.LoginRequest;
import com.duanruo.exam.application.dto.LoginResponse;
import com.duanruo.exam.application.dto.RegisterRequest;
import com.duanruo.exam.application.dto.SelectTenantRequest;
import com.duanruo.exam.application.dto.UserResponse;
import com.duanruo.exam.domain.tenant.UserTenantRole;
import com.duanruo.exam.domain.tenant.UserTenantRoleRepository;
import com.duanruo.exam.domain.user.*;
import com.duanruo.exam.shared.domain.TenantId;
import com.duanruo.exam.shared.exception.ApplicationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 认证应用服务
 */
@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenService jwtTokenService;
    @Autowired
    private UserTenantRoleRepository userTenantRoleRepository;
    @Value("${app.security.bootstrap-token:}")
    private String bootstrapToken;



    // Default constructor for framework proxies
    public AuthenticationService() {}

    // Extra constructor for tests/manual wiring; Spring will prefer default + field injection
    public AuthenticationService(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }


    /**
     * 用户登录
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // 安全日志：仅记录用户名，不记录密码等敏感信息
        if (log.isDebugEnabled()) {
            log.debug("Login attempt: username='{}'", request.getUsername());

        }

        // 查找用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ApplicationException("用户名或密码错误"));



        // 验证密码（容错：当库内hash非法导致匹配抛异常时，一律按不匹配处理）
        boolean passwordOk;
        try {
            passwordOk = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        } catch (IllegalArgumentException e) {
            log.warn("Password hash format invalid for user='{}'", user.getUsername());
            passwordOk = false;
        }
        if (!passwordOk) {
            throw new ApplicationException("用户名或密码错误");
        }

        // 检查用户状态
        if (!user.canLogin()) {
            throw new ApplicationException("用户账户已被禁用或锁定");
        }

        // 更新最后登录时间（临时：不触发持久化，避免历史数据版本/约束导致的登录500；后续用事件/异步任务持久化）
        user.updateLastLogin();

        // 检查用户是否有租户角色
        log.info("Checking tenant roles for user: userId={}, username={}", user.getId(), user.getUsername());
        List<UserTenantRole> userTenantRoles = userTenantRoleRepository.findAllByUser(user.getId());
        log.info("Found {} tenant roles for user {}", userTenantRoles.size(), user.getUsername());

        String token;
        if (!userTenantRoles.isEmpty()) {
            // 用户有租户角色，选择第一个活跃的租户角色生成token
            UserTenantRole primaryTenantRole = userTenantRoles.stream()
                    .filter(UserTenantRole::isActive)
                    .findFirst()
                    .orElse(null);

            if (primaryTenantRole != null) {
                // 合并全局角色和租户角色
                Set<Role> allRoles = new HashSet<>(user.getRoles());
                allRoles.add(primaryTenantRole.getRole());

                // 生成包含租户信息的token
                token = jwtTokenService.generateTenantToken(
                        user.getId().toString(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getFullName(),
                        primaryTenantRole.getTenantId().toString(),
                        allRoles,
                        user.getStatus().name()
                );

                log.info("User {} logged in with tenant context: tenantId={}, roles={}",
                        user.getUsername(),
                        primaryTenantRole.getTenantId(),
                        allRoles.stream().map(Role::getName).collect(Collectors.toList()));
            } else {
                // 没有活跃的租户角色，使用全局角色
                token = jwtTokenService.generateToken(user);
                log.info("User {} logged in with global roles only (no active tenant roles)", user.getUsername());
            }
        } else {
            // 没有租户角色，使用全局角色
            token = jwtTokenService.generateToken(user);
            log.info("User {} logged in with global roles only", user.getUsername());
        }

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenService.getExpirationTime())
                .user(UserResponse.fromUser(user))
                .build();
    }

    /**
     * 用户注册（候选人）
     */
    @Transactional
    public UserResponse registerCandidate(RegisterRequest request) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApplicationException("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApplicationException("邮箱已被注册");
        }

        // 检查手机号是否已存在（如果提供）
        if (request.getPhoneNumber() != null &&
            userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new ApplicationException("手机号已被注册");
        }

        // 创建新用户
        UserId userId = UserId.generate();
        String passwordHash = passwordEncoder.encode(request.getPassword());

        User user = new User(
                userId,
                request.getUsername(),
                request.getEmail(),
                passwordHash,
                request.getFullName(),
                Set.of(Role.CANDIDATE)
        );

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        userRepository.save(user);

        return UserResponse.fromUser(user);
    }

    /**
     * 创建系统用户（管理员、审核员等）
     */
    @Transactional
    public UserResponse createSystemUser(RegisterRequest request, Set<Role> roles) {
        // 检查权限 - 只有管理员可以创建系统用户
        // 这里应该通过SecurityContext获取当前用户权限，简化处理

        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApplicationException("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApplicationException("邮箱已被注册");
        }

        // 创建新用户
        UserId userId = UserId.generate();
        String passwordHash = passwordEncoder.encode(request.getPassword());

        User user = new User(
                userId,
                request.getUsername(),
                request.getEmail(),
                passwordHash,
                request.getFullName(),
                roles
        );

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }

        if (request.getJobTitle() != null) {
            user.setJobTitle(request.getJobTitle());
        }

        userRepository.save(user);

        return UserResponse.fromUser(user);
    }

    /**
     * 首次引导创建超级管理员（仅当系统中不存在任何管理员时可用）
     */
    public UserResponse createInitialAdminIfNone(RegisterRequest request, String providedToken) {
        long adminCount = userRepository.countByRole(Role.SUPER_ADMIN) + userRepository.countByRole(Role.ADMIN);
        if (adminCount > 0) {
            throw new ApplicationException("系统已存在管理员，禁止引导创建");
        }
        // 校验引导令牌（如果配置了令牌，则必须匹配）
        if (bootstrapToken != null && !bootstrapToken.isBlank()) {
            if (providedToken == null || !bootstrapToken.equals(providedToken)) {
                throw new ApplicationException("引导令牌无效或缺失");
            }
        }
        if (!request.isPasswordConfirmed()) {
            throw new ApplicationException("密码与确认密码不一致");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApplicationException("用户名已存在");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApplicationException("邮箱已被注册");
        }
        UserId userId = UserId.generate();
        String passwordHash = passwordEncoder.encode(request.getPassword());
        User user = new User(
                userId,
                request.getUsername(),
                request.getEmail(),
                passwordHash,
                request.getFullName(),
                Set.of(Role.SUPER_ADMIN)
        );
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getJobTitle() != null) {
            user.setJobTitle(request.getJobTitle());
        }
        userRepository.save(user);
        return UserResponse.fromUser(user);
    }

    /**
     * 刷新Token
     */
    @Transactional(readOnly = true)
    public LoginResponse refreshToken(String token) {
        if (!jwtTokenService.validateToken(token)) {
            throw new ApplicationException("无效的Token");
        }

        String username = jwtTokenService.getUsernameFromToken(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApplicationException("用户不存在"));

        if (!user.canLogin()) {
            throw new ApplicationException("用户账户已被禁用或锁定");
        }

        String newToken = jwtTokenService.generateToken(user);

        return LoginResponse.builder()
                .token(newToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenService.getExpirationTime())
                .user(UserResponse.fromUser(user))
                .build();
    }

    /**
     * 修改密码
     */
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApplicationException("用户不存在"));

        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new ApplicationException("原密码错误");
        }

        // 更新密码
        String newPasswordHash = passwordEncoder.encode(newPassword);
        user.changePassword(newPasswordHash);

        userRepository.save(user);
    }

    /**
     * 重置密码（管理员操作）
     */
    public void resetPassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApplicationException("用户不存在"));

        String newPasswordHash = passwordEncoder.encode(newPassword);
        user.changePassword(newPasswordHash);

        userRepository.save(user);
    }

    /**
     * 激活用户
     */
    public void activateUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApplicationException("用户不存在"));

        user.activate();
        userRepository.save(user);
    }

    /**
     * 停用用户
     */
    public void deactivateUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApplicationException("用户不存在"));

        user.deactivate();
        userRepository.save(user);
    }

    /**
     * 锁定用户
     */
    public void lockUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApplicationException("用户不存在"));

        user.lock();
        userRepository.save(user);
    }
    /**
     * 获取当前登录用户信息（支持 principal 为 UUID 或 username）
     */
    public com.duanruo.exam.application.dto.UserResponse getUserProfile(String principal) {
        com.duanruo.exam.domain.user.User user = null;
        // 尝试按 UUID 查询
        try {
            java.util.UUID id = java.util.UUID.fromString(principal);
            user = userRepository.findById(com.duanruo.exam.domain.user.UserId.of(id)).orElse(null);
        } catch (IllegalArgumentException ignored) {
        }
        // 回退到按用户名查询
        if (user == null) {
            user = userRepository.findByUsername(principal)
                    .orElseThrow(() -> new com.duanruo.exam.shared.exception.ApplicationException("用户不存在"));
        }
        return com.duanruo.exam.application.dto.UserResponse.fromUser(user);
    }

    /**
     * 选择租户并生成租户特定Token
     * @param request 选择租户请求
     * @param currentUserId 当前用户ID
     * @return 包含租户特定Token的登录响应
     */
    @Transactional(readOnly = true)
    public LoginResponse selectTenant(SelectTenantRequest request, String currentUserId) {
        log.info("User {} selecting tenant {}", currentUserId, request.getTenantId());

        // 1. 获取用户信息
        UserId userIdObj = UserId.of(java.util.UUID.fromString(currentUserId));
        User user = userRepository.findById(userIdObj)
                .orElseThrow(() -> new ApplicationException("用户不存在"));

        // 2. 验证用户状态
        if (!user.canLogin()) {
            throw new ApplicationException("用户账户已被禁用或锁定");
        }

        // 3. 验证用户是否有权访问该租户
        TenantId tenantId = TenantId.of(java.util.UUID.fromString(request.getTenantId()));

        // 超级管理员可以访问所有租户
        boolean hasAccess = user.hasRole(Role.SUPER_ADMIN);

        if (!hasAccess) {
            // 检查用户是否属于该租户
            hasAccess = userTenantRoleRepository.belongsToTenant(userIdObj, tenantId);
            if (!hasAccess) {
                throw new ApplicationException("您没有权限访问该租户");
            }
        }

        // 4. 查询用户在该租户下的角色
        List<UserTenantRole> tenantRoles = userTenantRoleRepository
                .findActiveRolesByUserAndTenant(userIdObj, tenantId);

        // 5. 合并全局角色和租户角色
        Set<Role> allRoles = new HashSet<>(user.getRoles());  // 全局角色
        allRoles.addAll(tenantRoles.stream()
                .map(UserTenantRole::getRole)
                .collect(Collectors.toList()));  // 租户角色

        log.info("User {} has {} roles in tenant {}: global={}, tenant={}",
                currentUserId, allRoles.size(), request.getTenantId(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toList()),
                tenantRoles.stream().map(utr -> utr.getRole().getName()).collect(Collectors.toList()));

        // 6. 生成新的JWT Token（包含租户信息和所有角色）
        String newToken = jwtTokenService.generateTenantToken(
                user.getId().toString(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                tenantId.toString(),
                allRoles,
                user.getStatus().name()
        );

        // 7. 返回新Token
        return LoginResponse.builder()
                .token(newToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenService.getExpirationTime())
                .user(UserResponse.fromUser(user))
                .build();
    }
}
