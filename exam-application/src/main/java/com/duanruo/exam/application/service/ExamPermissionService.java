package com.duanruo.exam.application.service;

import com.duanruo.exam.application.port.TenantContextPort;
import com.duanruo.exam.domain.admin.ExamAdminRepository;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.user.Permission;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import com.duanruo.exam.domain.tenant.UserTenantRoleRepository;
import com.duanruo.exam.shared.domain.TenantId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 考试权限服务
 * 实现基于考试的ROW级别权限控制
 */
@Service
public class ExamPermissionService {

    private final UserRepository userRepository;
    private final ExamAdminRepository examAdminRepository;
    private final UserTenantRoleRepository userTenantRoleRepository;
    private final TenantContextPort tenantContextPort;

    public ExamPermissionService(UserRepository userRepository,
                                ExamAdminRepository examAdminRepository,
                                UserTenantRoleRepository userTenantRoleRepository,
                                TenantContextPort tenantContextPort) {
        this.userRepository = userRepository;
        this.examAdminRepository = examAdminRepository;
        this.userTenantRoleRepository = userTenantRoleRepository;
        this.tenantContextPort = tenantContextPort;
    }

    /**
     * 检查用户是否有指定考试的特定权限
     * @param userId 用户ID
     * @param examId 考试ID
     * @param permission 权限
     * @return 是否有权限
     */
    public boolean hasExamPermission(UserId userId, ExamId examId, Permission permission) {
        // 1. 获取用户信息
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        // 2. 检查是否是超级管理员（全局角色）
        if (user.hasRole(Role.SUPER_ADMIN)) {
            return user.hasPermission(permission);
        }

        // 3. 检查是否是租户管理员（租户角色）
        // 租户管理员对其租户内的所有考试都有权限
        // 需要检查user_tenant_roles表中的租户角色
        TenantId currentTenantId = tenantContextPort.getCurrentTenantId();
        if (currentTenantId != null) {
            boolean isTenantAdmin = userTenantRoleRepository.hasRole(userId, currentTenantId, Role.TENANT_ADMIN);
            if (isTenantAdmin && Role.TENANT_ADMIN.getPermissions().contains(permission)) {
                return true;
            }
        }

        // 4. 检查是否是该考试的管理员
        if (user.hasRole(Role.EXAM_ADMIN) && examAdminRepository.exists(examId, userId)) {
            // 检查用户角色是否包含该权限
            if (user.hasPermission(permission)) {
                // 进一步检查考试级别的权限配置
                return hasExamSpecificPermission(examId, userId, permission);
            }
        }

        // 5. 检查审核员权限（基于exam_reviewers表）
        if (user.hasRole(Role.PRIMARY_REVIEWER) || user.hasRole(Role.SECONDARY_REVIEWER)) {
            return user.hasPermission(permission) && isReviewerForExam(userId, examId);
        }

        // 6. 其他角色的权限检查
        return user.hasPermission(permission);
    }

    /**
     * 检查用户是否有指定考试的特定权限（使用UUID参数）
     */
    public boolean hasExamPermission(java.util.UUID userId, java.util.UUID examId, Permission permission) {
        return hasExamPermission(UserId.of(userId), ExamId.of(examId), permission);
    }

    /**
     * 获取用户可以管理的所有考试ID
     * @param userId 用户ID
     * @return 考试ID列表
     */
    public List<ExamId> getManageableExamIds(UserId userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return List.of();
        }
        
        User user = userOpt.get();
        
        // 超级管理员可以管理所有考试
        if (user.hasRole(Role.SUPER_ADMIN)) {
            // 这里需要从ExamRepository获取所有考试ID，暂时返回空列表
            // TODO: 注入ExamRepository并实现获取所有考试ID的逻辑
            return List.of();
        }
        
        // 考试管理员只能管理被分配的考试
        if (user.hasRole(Role.EXAM_ADMIN)) {
            return examAdminRepository.findExamIdsByAdmin(userId);
        }
        
        return List.of();
    }

    /**
     * 检查用户是否是指定考试的管理员
     * @param userId 用户ID
     * @param examId 考试ID
     * @return 是否是管理员
     */
    public boolean isExamAdmin(UserId userId, ExamId examId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        
        // 超级管理员是所有考试的管理员
        if (user.hasRole(Role.SUPER_ADMIN)) {
            return true;
        }
        
        // 检查是否是该考试的指定管理员
        return user.hasRole(Role.EXAM_ADMIN) && examAdminRepository.exists(examId, userId);
    }

    /**
     * 分配考试管理员
     * @param examId 考试ID
     * @param adminId 管理员ID
     * @param permissions 权限配置
     * @param operatorId 操作者ID
     */
    public void assignExamAdmin(ExamId examId, UserId adminId, Map<String, Object> permissions, UserId operatorId) {
        // 检查操作者权限
        if (!hasExamPermission(operatorId, examId, Permission.EXAM_ADMIN_MANAGE)) {
            throw new SecurityException("无权限分配考试管理员");
        }
        
        // 检查被分配者是否有EXAM_ADMIN角色
        Optional<User> adminOpt = userRepository.findById(adminId);
        if (adminOpt.isEmpty() || !adminOpt.get().hasRole(Role.EXAM_ADMIN)) {
            throw new IllegalArgumentException("用户不具备考试管理员角色");
        }
        
        examAdminRepository.add(examId, adminId, permissions, operatorId);
    }

    /**
     * 移除考试管理员
     * @param examId 考试ID
     * @param adminId 管理员ID
     * @param operatorId 操作者ID
     */
    public void removeExamAdmin(ExamId examId, UserId adminId, UserId operatorId) {
        // 检查操作者权限
        if (!hasExamPermission(operatorId, examId, Permission.EXAM_ADMIN_MANAGE)) {
            throw new SecurityException("无权限移除考试管理员");
        }
        
        examAdminRepository.remove(examId, adminId);
    }

    /**
     * 检查考试级别的特定权限
     */
    private boolean hasExamSpecificPermission(ExamId examId, UserId userId, Permission permission) {
        Optional<Map<String, Object>> permissionsOpt = examAdminRepository.findPermissions(examId, userId);
        if (permissionsOpt.isEmpty()) {
            return false;
        }
        
        Map<String, Object> permissions = permissionsOpt.get();
        
        // 根据权限类型检查具体配置
        return switch (permission) {
            case SCORE_RECORD, SCORE_UPDATE, SCORE_DELETE -> 
                Boolean.TRUE.equals(permissions.get("canManageScores"));
            case VENUE_CREATE, VENUE_UPDATE, VENUE_DELETE, EXAM_VENUE_MANAGE -> 
                Boolean.TRUE.equals(permissions.get("canManageVenues"));
            case POSITION_CREATE, POSITION_UPDATE, POSITION_DELETE -> 
                Boolean.TRUE.equals(permissions.get("canManagePositions"));
            case SUBJECT_CREATE, SUBJECT_UPDATE, SUBJECT_DELETE -> 
                Boolean.TRUE.equals(permissions.get("canManageSubjects"));
            default -> true; // 其他权限默认允许
        };
    }

    /**
     * 检查用户是否是指定考试的审核员
     * TODO: 这里需要查询exam_reviewers表，暂时返回false
     */
    private boolean isReviewerForExam(UserId userId, ExamId examId) {
        // TODO: 实现审核员权限检查逻辑
        return false;
    }
}
