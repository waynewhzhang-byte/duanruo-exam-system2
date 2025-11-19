package com.duanruo.exam.domain.user;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 角色权限测试
 * 验证角色权限分配的正确性
 */
class RolePermissionTest {

    /**
     * 测试SUPER_ADMIN拥有所有新增权限
     */
    @Test
    void testSuperAdminHasAllNewPermissions() {
        Role superAdmin = Role.SUPER_ADMIN;

        // 准考证相关
        assertTrue(superAdmin.hasPermission(Permission.TICKET_TEMPLATE_VIEW));
        assertTrue(superAdmin.hasPermission(Permission.TICKET_TEMPLATE_UPDATE));
        assertTrue(superAdmin.hasPermission(Permission.TICKET_TEMPLATE_DELETE));
        assertTrue(superAdmin.hasPermission(Permission.TICKET_VERIFY));
        assertTrue(superAdmin.hasPermission(Permission.TICKET_ISSUE));

        // 支付相关
        assertTrue(superAdmin.hasPermission(Permission.PAYMENT_INITIATE));
        assertTrue(superAdmin.hasPermission(Permission.PAYMENT_CONFIG_VIEW));

        // 座位和考场
        assertTrue(superAdmin.hasPermission(Permission.SEATING_ALLOCATE));
        assertTrue(superAdmin.hasPermission(Permission.VENUE_LIST));

        // 统计和模板
        assertTrue(superAdmin.hasPermission(Permission.STATISTICS_VIEW));
        assertTrue(superAdmin.hasPermission(Permission.TEMPLATE_CREATE));
        assertTrue(superAdmin.hasPermission(Permission.TEMPLATE_VIEW));
        assertTrue(superAdmin.hasPermission(Permission.TEMPLATE_UPDATE));
        assertTrue(superAdmin.hasPermission(Permission.TEMPLATE_DELETE));
        assertTrue(superAdmin.hasPermission(Permission.NOTIFICATION_HISTORY_VIEW));

        // 角色和岗位
        assertTrue(superAdmin.hasPermission(Permission.ROLE_MANAGE));
        assertTrue(superAdmin.hasPermission(Permission.PERMISSION_ASSIGN));
        assertTrue(superAdmin.hasPermission(Permission.POSITION_FORM_CONFIG));
    }

    /**
     * 测试TENANT_ADMIN拥有适当的新增权限
     */
    @Test
    void testTenantAdminHasAppropriateNewPermissions() {
        Role tenantAdmin = Role.TENANT_ADMIN;

        // 应该有的权限
        assertTrue(tenantAdmin.hasPermission(Permission.TICKET_TEMPLATE_VIEW));
        assertTrue(tenantAdmin.hasPermission(Permission.TICKET_TEMPLATE_UPDATE));
        assertTrue(tenantAdmin.hasPermission(Permission.TICKET_ISSUE));
        assertTrue(tenantAdmin.hasPermission(Permission.SEATING_ALLOCATE));
        assertTrue(tenantAdmin.hasPermission(Permission.VENUE_LIST));
        assertTrue(tenantAdmin.hasPermission(Permission.STATISTICS_VIEW));
        assertTrue(tenantAdmin.hasPermission(Permission.PAYMENT_CONFIG_VIEW));
        assertTrue(tenantAdmin.hasPermission(Permission.TEMPLATE_VIEW));
        assertTrue(tenantAdmin.hasPermission(Permission.NOTIFICATION_HISTORY_VIEW));
        assertTrue(tenantAdmin.hasPermission(Permission.POSITION_FORM_CONFIG));

        // 不应该有的权限（仅SUPER_ADMIN）
        assertFalse(tenantAdmin.hasPermission(Permission.ROLE_MANAGE));
        assertFalse(tenantAdmin.hasPermission(Permission.PERMISSION_ASSIGN));
        assertFalse(tenantAdmin.hasPermission(Permission.TICKET_TEMPLATE_DELETE));
        assertFalse(tenantAdmin.hasPermission(Permission.TEMPLATE_CREATE));
        assertFalse(tenantAdmin.hasPermission(Permission.TEMPLATE_UPDATE));
        assertFalse(tenantAdmin.hasPermission(Permission.TEMPLATE_DELETE));
    }

    /**
     * 测试EXAM_ADMIN拥有适当的新增权限
     */
    @Test
    void testExamAdminHasAppropriateNewPermissions() {
        Role examAdmin = Role.EXAM_ADMIN;

        // 应该有的权限
        assertTrue(examAdmin.hasPermission(Permission.TICKET_TEMPLATE_VIEW));
        assertTrue(examAdmin.hasPermission(Permission.TICKET_ISSUE));
        assertTrue(examAdmin.hasPermission(Permission.SEATING_ALLOCATE));
        assertTrue(examAdmin.hasPermission(Permission.VENUE_LIST));
        assertTrue(examAdmin.hasPermission(Permission.STATISTICS_VIEW));
        assertTrue(examAdmin.hasPermission(Permission.POSITION_FORM_CONFIG));

        // 不应该有的权限
        assertFalse(examAdmin.hasPermission(Permission.TICKET_TEMPLATE_UPDATE));
        assertFalse(examAdmin.hasPermission(Permission.TICKET_TEMPLATE_DELETE));
        assertFalse(examAdmin.hasPermission(Permission.PAYMENT_INITIATE));
        assertFalse(examAdmin.hasPermission(Permission.PAYMENT_CONFIG_VIEW));
        assertFalse(examAdmin.hasPermission(Permission.ROLE_MANAGE));
        assertFalse(examAdmin.hasPermission(Permission.PERMISSION_ASSIGN));
    }

    /**
     * 测试CANDIDATE拥有适当的新增权限
     */
    @Test
    void testCandidateHasAppropriateNewPermissions() {
        Role candidate = Role.CANDIDATE;

        // 应该有的权限
        assertTrue(candidate.hasPermission(Permission.PAYMENT_INITIATE));

        // 不应该有的权限
        assertFalse(candidate.hasPermission(Permission.TICKET_TEMPLATE_VIEW));
        assertFalse(candidate.hasPermission(Permission.SEATING_ALLOCATE));
        assertFalse(candidate.hasPermission(Permission.VENUE_LIST));
        assertFalse(candidate.hasPermission(Permission.STATISTICS_VIEW));
        assertFalse(candidate.hasPermission(Permission.PAYMENT_CONFIG_VIEW));
    }

    /**
     * 测试EXAMINER拥有适当的新增权限
     */
    @Test
    void testExaminerHasAppropriateNewPermissions() {
        Role examiner = Role.EXAMINER;

        // 应该有的权限
        assertTrue(examiner.hasPermission(Permission.TICKET_VERIFY));

        // 不应该有的权限
        assertFalse(examiner.hasPermission(Permission.TICKET_TEMPLATE_VIEW));
        assertFalse(examiner.hasPermission(Permission.TICKET_ISSUE));
    }

    /**
     * 测试PRIMARY_REVIEWER和SECONDARY_REVIEWER没有新增权限
     */
    @Test
    void testReviewersDoNotHaveNewPermissions() {
        Role primaryReviewer = Role.PRIMARY_REVIEWER;
        Role secondaryReviewer = Role.SECONDARY_REVIEWER;

        // 审核员不应该有这些新增权限
        assertFalse(primaryReviewer.hasPermission(Permission.TICKET_TEMPLATE_VIEW));
        assertFalse(primaryReviewer.hasPermission(Permission.SEATING_ALLOCATE));
        assertFalse(primaryReviewer.hasPermission(Permission.STATISTICS_VIEW));

        assertFalse(secondaryReviewer.hasPermission(Permission.TICKET_TEMPLATE_VIEW));
        assertFalse(secondaryReviewer.hasPermission(Permission.SEATING_ALLOCATE));
        assertFalse(secondaryReviewer.hasPermission(Permission.STATISTICS_VIEW));
    }

    /**
     * 测试角色权限数量
     */
    @Test
    void testRolePermissionCounts() {
        // SUPER_ADMIN应该有最多的权限（约80+）
        int superAdminCount = Role.SUPER_ADMIN.getPermissions().size();
        assertTrue(superAdminCount >= 75,
            "SUPER_ADMIN应该有至少75个权限，实际有 " + superAdminCount + " 个");

        // TENANT_ADMIN应该有60+权限
        int tenantAdminCount = Role.TENANT_ADMIN.getPermissions().size();
        assertTrue(tenantAdminCount >= 60,
            "TENANT_ADMIN应该有至少60个权限，实际有 " + tenantAdminCount + " 个");

        // EXAM_ADMIN应该有35+权限
        int examAdminCount = Role.EXAM_ADMIN.getPermissions().size();
        assertTrue(examAdminCount >= 35,
            "EXAM_ADMIN应该有至少35个权限，实际有 " + examAdminCount + " 个");

        // CANDIDATE应该有较少的权限
        assertTrue(Role.CANDIDATE.getPermissions().size() >= 10,
            "CANDIDATE应该有至少10个权限");

        // 审核员应该有4个权限
        assertEquals(4, Role.PRIMARY_REVIEWER.getPermissions().size(),
            "PRIMARY_REVIEWER应该有4个权限");
        assertEquals(4, Role.SECONDARY_REVIEWER.getPermissions().size(),
            "SECONDARY_REVIEWER应该有4个权限");

        // EXAMINER应该有4个权限
        assertEquals(4, Role.EXAMINER.getPermissions().size(),
            "EXAMINER应该有4个权限");
    }

    /**
     * 测试角色层级关系
     */
    @Test
    void testRoleHierarchy() {
        // SUPER_ADMIN应该包含TENANT_ADMIN的所有权限
        Set<Permission> superAdminPerms = Role.SUPER_ADMIN.getPermissions();
        Set<Permission> tenantAdminPerms = Role.TENANT_ADMIN.getPermissions();

        for (Permission perm : tenantAdminPerms) {
            // 跳过TENANT_USER_MANAGE，这是租户特有的
            if (perm != Permission.TENANT_USER_MANAGE) {
                assertTrue(superAdminPerms.contains(perm) || perm == Permission.TENANT_USER_MANAGE,
                    "SUPER_ADMIN应该包含TENANT_ADMIN的权限: " + perm);
            }
        }
    }

    /**
     * 测试角色识别方法
     */
    @Test
    void testRoleIdentificationMethods() {
        assertTrue(Role.SUPER_ADMIN.isSystemAdmin());
        assertTrue(Role.SUPER_ADMIN.isAdmin());
        assertFalse(Role.SUPER_ADMIN.isTenantAdmin());
        assertFalse(Role.SUPER_ADMIN.isReviewer());
        assertFalse(Role.SUPER_ADMIN.isCandidate());

        assertTrue(Role.TENANT_ADMIN.isTenantAdmin());
        assertTrue(Role.TENANT_ADMIN.isAdmin());
        assertFalse(Role.TENANT_ADMIN.isSystemAdmin());

        assertTrue(Role.PRIMARY_REVIEWER.isReviewer());
        assertFalse(Role.PRIMARY_REVIEWER.isAdmin());

        assertTrue(Role.SECONDARY_REVIEWER.isReviewer());
        assertFalse(Role.SECONDARY_REVIEWER.isAdmin());

        assertTrue(Role.CANDIDATE.isCandidate());
        assertFalse(Role.CANDIDATE.isAdmin());
        assertFalse(Role.CANDIDATE.isReviewer());
    }

    /**
     * 测试角色fromName方法
     */
    @Test
    void testRoleFromName() {
        assertEquals(Role.SUPER_ADMIN, Role.fromName("SUPER_ADMIN"));
        assertEquals(Role.SUPER_ADMIN, Role.fromName("ADMIN")); // 向后兼容
        assertEquals(Role.TENANT_ADMIN, Role.fromName("TENANT_ADMIN"));
        assertEquals(Role.EXAM_ADMIN, Role.fromName("EXAM_ADMIN"));
        assertEquals(Role.PRIMARY_REVIEWER, Role.fromName("PRIMARY_REVIEWER"));
        assertEquals(Role.SECONDARY_REVIEWER, Role.fromName("SECONDARY_REVIEWER"));
        assertEquals(Role.CANDIDATE, Role.fromName("CANDIDATE"));
        assertEquals(Role.EXAMINER, Role.fromName("EXAMINER"));

        assertThrows(IllegalArgumentException.class, () -> Role.fromName("UNKNOWN_ROLE"));
    }

    /**
     * 测试角色hasAnyPermission方法
     */
    @Test
    void testHasAnyPermission() {
        Role candidate = Role.CANDIDATE;

        assertTrue(candidate.hasAnyPermission(
            Permission.APPLICATION_CREATE,
            Permission.EXAM_CREATE
        ));

        assertFalse(candidate.hasAnyPermission(
            Permission.EXAM_CREATE,
            Permission.USER_MANAGE
        ));
    }

    /**
     * 测试角色不可变性
     */
    @Test
    void testRoleImmutability() {
        Role superAdmin = Role.SUPER_ADMIN;
        Set<Permission> permissions = superAdmin.getPermissions();

        // 尝试修改权限集合应该抛出异常
        assertThrows(UnsupportedOperationException.class, () -> {
            permissions.add(Permission.EXAM_CREATE);
        });
    }

    /**
     * 测试所有角色都有名称和描述
     */
    @Test
    void testAllRolesHaveNameAndDescription() {
        Role[] roles = {
            Role.SUPER_ADMIN,
            Role.TENANT_ADMIN,
            Role.EXAM_ADMIN,
            Role.PRIMARY_REVIEWER,
            Role.SECONDARY_REVIEWER,
            Role.CANDIDATE,
            Role.EXAMINER
        };

        for (Role role : roles) {
            assertNotNull(role.getName());
            assertFalse(role.getName().trim().isEmpty());
            assertNotNull(role.getDescription());
            assertFalse(role.getDescription().trim().isEmpty());
        }
    }
}

