package com.duanruo.exam.domain.user;

import com.duanruo.exam.shared.domain.ValueObject;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Set;

/**
 * 角色值对象
 * 根据PRD定义的角色系统
 */
public class Role extends ValueObject {

    private final String name;
    private final String description;
    private final Set<Permission> permissions;

    public Role(String name, String description, Set<Permission> permissions) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Role name cannot be null or empty");
        }
        this.name = name;
        this.description = description;
        this.permissions = permissions != null ? Set.copyOf(permissions) : Set.of();
    }

    // 预定义角色常量
    public static final Role SUPER_ADMIN = new Role(
        "SUPER_ADMIN",
        "超级管理员 - 拥有所有权限，可以创建和管理所有考试",
        Set.of(
            Permission.EXAM_CREATE,
            Permission.EXAM_UPDATE,
            Permission.EXAM_DELETE,
            Permission.EXAM_VIEW,
            Permission.EXAM_OPEN,
            Permission.EXAM_CLOSE,
            Permission.POSITION_CREATE,
            Permission.POSITION_UPDATE,
            Permission.POSITION_DELETE,
            Permission.POSITION_VIEW,
            Permission.POSITION_FORM_CONFIG,
            Permission.SUBJECT_CREATE,
            Permission.SUBJECT_UPDATE,
            Permission.SUBJECT_DELETE,
            Permission.SUBJECT_VIEW,
            Permission.APPLICATION_VIEW_ALL,
            Permission.APPLICATION_BULK_OPERATION,
            Permission.REVIEW_PRIMARY,
            Permission.REVIEW_SECONDARY,
            Permission.REVIEW_STATISTICS,
            Permission.REVIEW_BATCH,
            Permission.TICKET_GENERATE,
            Permission.TICKET_BATCH_GENERATE,
            Permission.TICKET_VALIDATE,
            Permission.TICKET_VERIFY,
            Permission.TICKET_ISSUE,
            Permission.TICKET_TEMPLATE_VIEW,
            Permission.TICKET_TEMPLATE_UPDATE,
            Permission.TICKET_TEMPLATE_DELETE,
            Permission.FILE_SCAN,
            Permission.TENANT_CREATE,
            Permission.TENANT_UPDATE,
            Permission.TENANT_DELETE,
            Permission.TENANT_VIEW,
            Permission.TENANT_VIEW_ALL,
            Permission.TENANT_ACTIVATE,
            Permission.TENANT_DEACTIVATE,
            Permission.USER_MANAGE,
            Permission.USER_CREATE,
            Permission.USER_CREATE_TENANT,
            Permission.USER_TENANT_ROLE_GRANT,
            Permission.ROLE_MANAGE,
            Permission.PERMISSION_ASSIGN,
            Permission.SYSTEM_CONFIG,
            Permission.SYSTEM_MONITOR,
            Permission.EXAM_ADMIN_MANAGE,
            Permission.SCORE_RECORD,
            Permission.SCORE_VIEW,
            Permission.SCORE_UPDATE,
            Permission.SCORE_DELETE,
            Permission.SCORE_BATCH_IMPORT,
            Permission.SCORE_STATISTICS,
            Permission.EXAM_FORM_CONFIG,
            Permission.EXAM_VENUE_MANAGE,
            Permission.EXAM_SCHEDULE_MANAGE,
            Permission.INTERVIEW_SCHEDULE,
            Permission.INTERVIEW_CONDUCT,
            Permission.INTERVIEW_RESULT,
            Permission.VENUE_CREATE,
            Permission.VENUE_UPDATE,
            Permission.VENUE_DELETE,
            Permission.VENUE_VIEW,
            Permission.VENUE_LIST,
            Permission.SEAT_ALLOCATE,
            Permission.SEAT_VIEW,
            Permission.SEAT_UPDATE,
            Permission.SEATING_ALLOCATE,
            Permission.NOTIFICATION_SEND,
            Permission.NOTIFICATION_VIEW,
            Permission.NOTIFICATION_HISTORY_VIEW,
            Permission.TEMPLATE_CREATE,
            Permission.TEMPLATE_VIEW,
            Permission.TEMPLATE_UPDATE,
            Permission.TEMPLATE_DELETE,
            Permission.REPORT_VIEW,
            Permission.REPORT_EXPORT,
            Permission.STATISTICS_VIEW,
            Permission.PAYMENT_CREATE,
            Permission.PAYMENT_VIEW,
            Permission.PAYMENT_INITIATE,
            Permission.PAYMENT_CONFIG_VIEW,
            Permission.FILE_UPLOAD,
            Permission.FILE_VIEW_OWN,
            Permission.FILE_VIEW,
            Permission.FILE_DELETE,
            Permission.TICKET_DOWNLOAD,
            Permission.TICKET_VIEW_OWN,
            Permission.AUDIT_VIEW,
            Permission.AUDIT_EXPORT,
            Permission.PII_EXPORT,
            Permission.PII_ANONYMIZE,
            Permission.PII_DELETE,
            Permission.PII_AUDIT,
            Permission.PII_POLICY_VIEW,
            Permission.STATISTICS_SYSTEM_VIEW,
            Permission.STATISTICS_TENANT_VIEW
        )
    );

    @Deprecated
    public static final Role ADMIN = SUPER_ADMIN; // 向后兼容

    public static final Role TENANT_ADMIN = new Role(
        "TENANT_ADMIN",
        "租户管理员 - 管理特定租户内的所有事务",
        Set.of(
            Permission.EXAM_CREATE,
            Permission.EXAM_UPDATE,
            Permission.EXAM_DELETE,
            Permission.EXAM_VIEW,
            Permission.EXAM_OPEN,
            Permission.EXAM_CLOSE,
            Permission.EXAM_FORM_CONFIG,
            Permission.EXAM_VENUE_MANAGE,
            Permission.EXAM_SCHEDULE_MANAGE,
            Permission.EXAM_ADMIN_MANAGE,  // 添加考试管理员管理权限
            Permission.POSITION_CREATE,
            Permission.POSITION_UPDATE,
            Permission.POSITION_DELETE,
            Permission.POSITION_VIEW,
            Permission.POSITION_FORM_CONFIG,
            Permission.SUBJECT_CREATE,
            Permission.SUBJECT_UPDATE,
            Permission.SUBJECT_DELETE,
            Permission.SUBJECT_VIEW,
            Permission.APPLICATION_VIEW_ALL,
            Permission.APPLICATION_BULK_OPERATION,
            Permission.REVIEW_PRIMARY,
            Permission.REVIEW_SECONDARY,
            Permission.REVIEW_STATISTICS,
            Permission.REVIEW_BATCH,
            Permission.TICKET_GENERATE,
            Permission.TICKET_BATCH_GENERATE,
            Permission.TICKET_VALIDATE,
            Permission.TICKET_DOWNLOAD,
            Permission.TICKET_ISSUE,
            Permission.TICKET_TEMPLATE_VIEW,
            Permission.TICKET_TEMPLATE_UPDATE,
            Permission.SCORE_RECORD,
            Permission.SCORE_VIEW,
            Permission.SCORE_UPDATE,
            Permission.SCORE_STATISTICS,
            Permission.SCORE_BATCH_IMPORT,
            Permission.VENUE_CREATE,
            Permission.VENUE_UPDATE,
            Permission.VENUE_DELETE,
            Permission.VENUE_VIEW,
            Permission.VENUE_LIST,
            Permission.SEAT_ALLOCATE,
            Permission.SEAT_VIEW,
            Permission.SEAT_UPDATE,
            Permission.SEATING_ALLOCATE,
            Permission.INTERVIEW_SCHEDULE,
            Permission.INTERVIEW_CONDUCT,
            Permission.INTERVIEW_RESULT,
            Permission.NOTIFICATION_SEND,
            Permission.NOTIFICATION_VIEW,
            Permission.NOTIFICATION_HISTORY_VIEW,
            Permission.TEMPLATE_VIEW,
            Permission.REPORT_VIEW,
            Permission.REPORT_EXPORT,
            Permission.STATISTICS_VIEW,
            Permission.PAYMENT_VIEW,
            Permission.PAYMENT_CONFIG_VIEW,
            Permission.FILE_VIEW,
            Permission.FILE_DELETE,
            Permission.FILE_UPLOAD,
            Permission.TENANT_USER_MANAGE,  // 租户级用户管理
            Permission.USER_CREATE_TENANT,  // 在租户内创建用户
            Permission.USER_TENANT_ROLE_GRANT,  // 授予用户租户角色
            Permission.PII_EXPORT,
            Permission.PII_ANONYMIZE,
            Permission.PII_DELETE,
            Permission.PII_POLICY_VIEW
        )
    );

    public static final Role EXAM_ADMIN = new Role(
        "EXAM_ADMIN",
        "考试管理员 - 只能管理被分配的考试",
        Set.of(
            Permission.EXAM_VIEW,
            Permission.EXAM_UPDATE,
            Permission.EXAM_FORM_CONFIG,
            Permission.EXAM_VENUE_MANAGE,
            Permission.EXAM_SCHEDULE_MANAGE,
            Permission.POSITION_CREATE,
            Permission.POSITION_UPDATE,
            Permission.POSITION_DELETE,
            Permission.POSITION_VIEW,
            Permission.POSITION_FORM_CONFIG,
            Permission.SUBJECT_CREATE,
            Permission.SUBJECT_UPDATE,
            Permission.SUBJECT_DELETE,
            Permission.SUBJECT_VIEW,
            Permission.APPLICATION_VIEW_ASSIGNED,
            Permission.SCORE_RECORD,
            Permission.SCORE_VIEW,
            Permission.SCORE_UPDATE,
            Permission.SCORE_STATISTICS,
            Permission.VENUE_CREATE,
            Permission.VENUE_UPDATE,
            Permission.VENUE_VIEW,
            Permission.VENUE_LIST,
            Permission.SEAT_ALLOCATE,
            Permission.SEAT_VIEW,
            Permission.SEAT_UPDATE,
            Permission.SEATING_ALLOCATE,
            Permission.INTERVIEW_SCHEDULE,
            Permission.INTERVIEW_RESULT,
            Permission.TICKET_GENERATE,
            Permission.TICKET_ISSUE,
            Permission.TICKET_TEMPLATE_VIEW,
            Permission.NOTIFICATION_SEND,
            Permission.REPORT_VIEW,
            Permission.REPORT_EXPORT,
            Permission.STATISTICS_VIEW
        )
    );

    public static final Role PRIMARY_REVIEWER = new Role(
        "PRIMARY_REVIEWER",
        "一级审核员 - 负责初级人工审核",
        Set.of(
            Permission.REVIEW_PRIMARY,
            Permission.APPLICATION_VIEW_ASSIGNED,
            Permission.REVIEW_STATISTICS,
            Permission.FILE_VIEW,
            Permission.FILE_UPLOAD
        )
    );

    public static final Role SECONDARY_REVIEWER = new Role(
        "SECONDARY_REVIEWER",
        "二级审核员 - 负责复核确认",
        Set.of(
            Permission.REVIEW_SECONDARY,
            Permission.APPLICATION_VIEW_ASSIGNED,
            Permission.REVIEW_STATISTICS,
            Permission.FILE_VIEW,
            Permission.FILE_UPLOAD
        )
    );

    public static final Role CANDIDATE = new Role(
        "CANDIDATE",
        "候选人 - 可以报名和查看自己的申请及成绩",
        Set.of(
            Permission.APPLICATION_CREATE,
            Permission.APPLICATION_VIEW_OWN,
            Permission.APPLICATION_UPDATE_OWN,
            Permission.APPLICATION_WITHDRAW,
            Permission.APPLICATION_PAY,
            Permission.FILE_UPLOAD,
            Permission.FILE_VIEW_OWN,
            Permission.PAYMENT_CREATE,
            Permission.PAYMENT_INITIATE,
            Permission.TICKET_VIEW_OWN,
            Permission.EXAM_VIEW_PUBLIC,
            Permission.SCORE_VIEW_OWN
        )
    );

    public static final Role EXAMINER = new Role(
        "EXAMINER",
        "考官 - 可以验证准考证",
        Set.of(
            Permission.TICKET_VALIDATE,
            Permission.TICKET_VERIFY,
            Permission.EXAM_VIEW,
            Permission.APPLICATION_VIEW_BASIC
        )
    );

    /**
     * 检查角色是否包含指定权限
     */
    public boolean hasPermission(Permission permission) {
        return permissions.contains(permission);
    }

    /**
     * 检查角色是否包含任一指定权限
     */
    public boolean hasAnyPermission(Permission... permissions) {
        for (Permission permission : permissions) {
            if (this.permissions.contains(permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否为系统管理员角色
     */
    public boolean isSystemAdmin() {
        return "SUPER_ADMIN".equals(name) || "ADMIN".equals(name);
    }

    /**
     * 检查是否为租户管理员角色
     */
    public boolean isTenantAdmin() {
        return "TENANT_ADMIN".equals(name);
    }

    /**
     * 检查是否为管理员角色（系统管理员或租户管理员）
     */
    public boolean isAdmin() {
        return isSystemAdmin() || isTenantAdmin();
    }

    /**
     * 检查是否为审核员角色
     */
    public boolean isReviewer() {
        return "PRIMARY_REVIEWER".equals(name) || "SECONDARY_REVIEWER".equals(name);
    }

    /**
     * 检查是否为候选人角色
     */
    public boolean isCandidate() {
        return "CANDIDATE".equals(name);
    }

    /**
     * 根据名称获取预定义角色
     * 用于JSON反序列化
     * 注意：@JsonCreator用于处理字符串到Role的转换
     */
    @JsonCreator
    public static Role fromName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Role name cannot be null or empty");
        }
        return switch (name) {
            case "SUPER_ADMIN" -> SUPER_ADMIN;
            case "ADMIN" -> SUPER_ADMIN; // 向后兼容
            case "TENANT_ADMIN" -> TENANT_ADMIN;
            case "EXAM_ADMIN" -> EXAM_ADMIN;
            case "PRIMARY_REVIEWER" -> PRIMARY_REVIEWER;
            case "SECONDARY_REVIEWER" -> SECONDARY_REVIEWER;
            case "CANDIDATE" -> CANDIDATE;
            case "EXAMINER" -> EXAMINER;
            default -> throw new IllegalArgumentException("Unknown role: " + name);
        };
    }

    // Getters
    @JsonValue
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Set<Permission> getPermissions() { return permissions; }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{name};
    }

    @Override
    public String toString() {
        return name;
    }
}
