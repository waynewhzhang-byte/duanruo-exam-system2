package com.duanruo.exam.adapter.rest.arch;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Lints security annotations to prevent regressions:
 * - No hasRole(...)
 * - No PERMISSION_ prefix in authorities
 * - Should use hasAuthority/hasAnyAuthority
 */
public class PreAuthorizeConventionsTest {

    @Test
    void preAuthorizeExpressions_shouldUseAuthorityNames_withoutRoleOrPermissionPrefix() throws Exception {
        List<Class<?>> controllers = scanControllers("com.duanruo.exam.adapter.rest.controller");
        List<String> violations = new ArrayList<>();

        // 定义禁止使用的角色名
        String[] forbiddenRoleNames = {
            "SUPER_ADMIN", "TENANT_ADMIN", "EXAM_ADMIN",
            "PRIMARY_REVIEWER", "SECONDARY_REVIEWER",
            "CANDIDATE", "EXAMINER", "ADMIN"
        };

        for (Class<?> c : controllers) {
            for (Method m : c.getDeclaredMethods()) {
                PreAuthorize pa = m.getAnnotation(PreAuthorize.class);
                if (pa != null) {
                    String v = pa.value();

                    // 检查是否使用 hasRole
                    if (v.contains("hasRole(")) {
                        violations.add(c.getSimpleName() + "#" + m.getName() + ": contains hasRole");
                    }

                    // 检查是否包含 PERMISSION_ 前缀
                    if (v.contains("PERMISSION_")) {
                        violations.add(c.getSimpleName() + "#" + m.getName() + ": contains PERMISSION_ prefix");
                    }

                    // 检查是否使用了角色名而非权限名
                    for (String roleName : forbiddenRoleNames) {
                        if (v.contains("'" + roleName + "'") || v.contains("\"" + roleName + "\"")) {
                            // 排除 permitAll() 和 isAuthenticated() 等特殊情况
                            if (!v.contains("permitAll()") && !v.contains("isAuthenticated()")) {
                                violations.add(c.getSimpleName() + "#" + m.getName() +
                                    ": uses role name '" + roleName + "' instead of permission name");
                            }
                        }
                    }

                    // 检查是否使用了 hasAuthority 或 hasAnyAuthority
                    if (!(v.contains("hasAuthority(") || v.contains("hasAnyAuthority(") ||
                          v.contains("permitAll()") || v.contains("isAuthenticated()"))) {
                        violations.add(c.getSimpleName() + "#" + m.getName() +
                            ": should use hasAuthority/hasAnyAuthority");
                    }
                }
            }
        }
        if (!violations.isEmpty()) {
            fail("PreAuthorize convention violations:\n" + String.join("\n", violations));
        }
    }

    private static List<Class<?>> scanControllers(String basePackage) throws Exception {
        // Simple manual list via package scanning using context ClassLoader
        // For robustness and speed, list known controller classes rather than complex classpath scanning.
        // If new controllers are added, keep this list updated.
        String[] known = new String[]{
                "com.duanruo.exam.adapter.rest.controller.ApplicationController",
                "com.duanruo.exam.adapter.rest.controller.AuditLogController",
                "com.duanruo.exam.adapter.rest.controller.AuthController",
                "com.duanruo.exam.adapter.rest.controller.ExamAdminController",
                "com.duanruo.exam.adapter.rest.controller.ExamController",
                "com.duanruo.exam.adapter.rest.controller.ExamReviewerController",
                "com.duanruo.exam.adapter.rest.controller.FileController",
                "com.duanruo.exam.adapter.rest.controller.NotificationHistoryController",
                "com.duanruo.exam.adapter.rest.controller.NotificationTemplateController",
                "com.duanruo.exam.adapter.rest.controller.PaymentController",
                "com.duanruo.exam.adapter.rest.controller.PIIComplianceController",
                "com.duanruo.exam.adapter.rest.controller.PositionController",
                "com.duanruo.exam.adapter.rest.controller.PublicExamController",
                "com.duanruo.exam.adapter.rest.controller.ReviewController",
                "com.duanruo.exam.adapter.rest.controller.ReviewQueueController",
                "com.duanruo.exam.adapter.rest.controller.ReviewStatsController",
                "com.duanruo.exam.adapter.rest.controller.RuleController",
                "com.duanruo.exam.adapter.rest.controller.ScoreController",
                "com.duanruo.exam.adapter.rest.controller.SeatingController",
                "com.duanruo.exam.adapter.rest.controller.StatisticsController",
                "com.duanruo.exam.adapter.rest.controller.SuperAdminController",
                "com.duanruo.exam.adapter.rest.controller.TenantController",
                "com.duanruo.exam.adapter.rest.controller.TicketController",
                "com.duanruo.exam.adapter.rest.controller.TicketNumberRuleController",
                "com.duanruo.exam.adapter.rest.controller.UserDirectoryController",
                "com.duanruo.exam.adapter.rest.controller.UserTenantRoleController",
                "com.duanruo.exam.adapter.rest.controller.VenueController"
        };
        List<Class<?>> list = new ArrayList<>();
        for (String k : known) {
            try {
                Class<?> cls = Class.forName(k);
                if (cls.isAnnotationPresent(RestController.class)) {
                    list.add(cls);
                }
            } catch (ClassNotFoundException ignore) { }
        }
        return list;
    }
}

