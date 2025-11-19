package com.duanruo.exam.domain.user;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 权限完整性测试
 * 验证所有权限定义的完整性和一致性
 */
class PermissionCompletenessTest {

    /**
     * 测试所有新增的权限都已定义
     */
    @Test
    void testAllRequiredPermissionsAreDefined() {
        // 这些是在Controller中使用但之前缺失的权限
        String[] requiredPermissions = {
            "ROLE_MANAGE",
            "PERMISSION_ASSIGN",
            "TICKET_TEMPLATE_VIEW",
            "TICKET_TEMPLATE_UPDATE",
            "TICKET_TEMPLATE_DELETE",
            "TICKET_VERIFY",
            "TICKET_ISSUE",
            "SEATING_ALLOCATE",
            "VENUE_LIST",
            "STATISTICS_VIEW",
            "PAYMENT_INITIATE",
            "PAYMENT_CONFIG_VIEW",
            "TEMPLATE_CREATE",
            "TEMPLATE_VIEW",
            "TEMPLATE_UPDATE",
            "TEMPLATE_DELETE",
            "NOTIFICATION_HISTORY_VIEW",
            "POSITION_FORM_CONFIG"
        };

        Set<String> definedPermissions = Arrays.stream(Permission.values())
            .map(Enum::name)
            .collect(Collectors.toSet());

        Set<String> missingPermissions = new HashSet<>();
        for (String required : requiredPermissions) {
            if (!definedPermissions.contains(required)) {
                missingPermissions.add(required);
            }
        }

        assertTrue(missingPermissions.isEmpty(),
            "以下权限未定义: " + missingPermissions);
    }

    /**
     * 测试所有权限都有描述
     */
    @Test
    void testAllPermissionsHaveDescription() {
        for (Permission permission : Permission.values()) {
            assertNotNull(permission.getDescription(),
                "权限 " + permission.name() + " 缺少描述");
            assertFalse(permission.getDescription().trim().isEmpty(),
                "权限 " + permission.name() + " 的描述为空");
        }
    }

    /**
     * 测试权限命名规范
     */
    @Test
    void testPermissionNamingConvention() {
        for (Permission permission : Permission.values()) {
            String name = permission.name();
            
            // 权限名称应该全部大写
            assertEquals(name, name.toUpperCase(),
                "权限 " + name + " 应该全部大写");
            
            // 权限名称应该使用下划线分隔
            assertFalse(name.contains("-"),
                "权限 " + name + " 不应该使用连字符");
            
            // 权限名称不应该有PERMISSION_前缀（除了PERMISSION_ASSIGN）
            if (!name.equals("PERMISSION_ASSIGN")) {
                assertFalse(name.startsWith("PERMISSION_"),
                    "权限 " + name + " 不应该有PERMISSION_前缀");
            }
        }
    }

    /**
     * 测试权限分类方法
     */
    @Test
    void testPermissionCategoryMethods() {
        // 测试考试相关权限
        assertTrue(Permission.EXAM_CREATE.isExamRelated());
        assertTrue(Permission.POSITION_CREATE.isExamRelated());
        assertTrue(Permission.SUBJECT_CREATE.isExamRelated());
        assertTrue(Permission.SCORE_RECORD.isExamRelated());
        assertFalse(Permission.USER_MANAGE.isExamRelated());

        // 测试审核相关权限
        assertTrue(Permission.REVIEW_PRIMARY.isReviewRelated());
        assertTrue(Permission.REVIEW_SECONDARY.isReviewRelated());
        assertTrue(Permission.APPLICATION_CREATE.isReviewRelated());
        assertFalse(Permission.EXAM_CREATE.isReviewRelated());

        // 测试文件相关权限
        assertTrue(Permission.FILE_UPLOAD.isFileRelated());
        assertTrue(Permission.FILE_VIEW.isFileRelated());
        assertFalse(Permission.EXAM_CREATE.isFileRelated());

        // 测试准考证相关权限
        assertTrue(Permission.TICKET_GENERATE.isTicketRelated());
        assertTrue(Permission.TICKET_VIEW_OWN.isTicketRelated());
        assertTrue(Permission.TICKET_TEMPLATE_VIEW.isTicketRelated());
        assertFalse(Permission.EXAM_CREATE.isTicketRelated());
    }

    /**
     * 测试管理员专用权限
     */
    @Test
    void testAdminOnlyPermissions() {
        assertTrue(Permission.USER_MANAGE.isAdminOnly());
        assertTrue(Permission.SYSTEM_CONFIG.isAdminOnly());
        assertTrue(Permission.EXAM_ADMIN_MANAGE.isAdminOnly());
        assertFalse(Permission.EXAM_VIEW.isAdminOnly());
        assertFalse(Permission.APPLICATION_CREATE.isAdminOnly());
    }

    /**
     * 测试只读权限
     */
    @Test
    void testReadOnlyPermissions() {
        assertTrue(Permission.EXAM_VIEW.isReadOnly());
        assertTrue(Permission.SCORE_VIEW.isReadOnly());
        assertTrue(Permission.REVIEW_STATISTICS.isReadOnly());
        assertTrue(Permission.AUDIT_VIEW.isReadOnly());
        assertFalse(Permission.EXAM_CREATE.isReadOnly());
        assertFalse(Permission.SCORE_RECORD.isReadOnly());
    }

    /**
     * 测试权限总数
     */
    @Test
    void testPermissionCount() {
        int totalPermissions = Permission.values().length;

        // 应该有100个权限（74个原有 + 18个新增 + 7个TENANT_* + 1个APPLICATION_PAY）
        assertEquals(100, totalPermissions,
            "权限总数应该是100个，实际有 " + totalPermissions + " 个");
    }

    /**
     * 测试新增的准考证相关权限
     */
    @Test
    void testNewTicketPermissions() {
        Set<String> definedPermissions = Arrays.stream(Permission.values())
            .map(Enum::name)
            .collect(Collectors.toSet());

        assertTrue(definedPermissions.contains("TICKET_TEMPLATE_VIEW"));
        assertTrue(definedPermissions.contains("TICKET_TEMPLATE_UPDATE"));
        assertTrue(definedPermissions.contains("TICKET_TEMPLATE_DELETE"));
        assertTrue(definedPermissions.contains("TICKET_VERIFY"));
        assertTrue(definedPermissions.contains("TICKET_ISSUE"));
    }

    /**
     * 测试新增的支付相关权限
     */
    @Test
    void testNewPaymentPermissions() {
        Set<String> definedPermissions = Arrays.stream(Permission.values())
            .map(Enum::name)
            .collect(Collectors.toSet());

        assertTrue(definedPermissions.contains("PAYMENT_INITIATE"));
        assertTrue(definedPermissions.contains("PAYMENT_CONFIG_VIEW"));
    }

    /**
     * 测试新增的座位和考场相关权限
     */
    @Test
    void testNewSeatingAndVenuePermissions() {
        Set<String> definedPermissions = Arrays.stream(Permission.values())
            .map(Enum::name)
            .collect(Collectors.toSet());

        assertTrue(definedPermissions.contains("SEATING_ALLOCATE"));
        assertTrue(definedPermissions.contains("VENUE_LIST"));
    }

    /**
     * 测试新增的统计和模板相关权限
     */
    @Test
    void testNewStatisticsAndTemplatePermissions() {
        Set<String> definedPermissions = Arrays.stream(Permission.values())
            .map(Enum::name)
            .collect(Collectors.toSet());

        assertTrue(definedPermissions.contains("STATISTICS_VIEW"));
        assertTrue(definedPermissions.contains("TEMPLATE_CREATE"));
        assertTrue(definedPermissions.contains("TEMPLATE_VIEW"));
        assertTrue(definedPermissions.contains("TEMPLATE_UPDATE"));
        assertTrue(definedPermissions.contains("TEMPLATE_DELETE"));
        assertTrue(definedPermissions.contains("NOTIFICATION_HISTORY_VIEW"));
    }

    /**
     * 测试新增的角色和岗位相关权限
     */
    @Test
    void testNewRoleAndPositionPermissions() {
        Set<String> definedPermissions = Arrays.stream(Permission.values())
            .map(Enum::name)
            .collect(Collectors.toSet());

        assertTrue(definedPermissions.contains("ROLE_MANAGE"));
        assertTrue(definedPermissions.contains("PERMISSION_ASSIGN"));
        assertTrue(definedPermissions.contains("POSITION_FORM_CONFIG"));
    }

    /**
     * 测试权限描述的唯一性
     */
    @Test
    void testPermissionDescriptionUniqueness() {
        Set<String> descriptions = new HashSet<>();
        Set<String> duplicates = new HashSet<>();

        for (Permission permission : Permission.values()) {
            String desc = permission.getDescription();
            if (!descriptions.add(desc)) {
                duplicates.add(desc);
            }
        }

        assertTrue(duplicates.isEmpty(),
            "以下权限描述重复: " + duplicates);
    }

    /**
     * 测试权限toString方法
     */
    @Test
    void testPermissionToString() {
        Permission permission = Permission.EXAM_CREATE;
        String toString = permission.toString();
        
        assertTrue(toString.contains("EXAM_CREATE"));
        assertTrue(toString.contains("创建考试"));
    }
}

