package com.duanruo.exam.adapter.rest.arch;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.fail;

/**
 * Lints endpoint paths to enforce project API standard:
 * - Controllers must use resource-relative paths (no /api or /v1 in annotations)
 */
public class PathConventionsTest {

    @Test
    void mappingPaths_shouldNotContainApiOrVersionPrefix() throws Exception {
        List<Class<?>> controllerList = scanControllers();

        List<String> violations = new ArrayList<>();
        for (Class<?> c : controllerList) {
            for (Method m : c.getDeclaredMethods()) {
                checkMappingAnnotation(violations, c, m, m.getAnnotation(RequestMapping.class));
                checkMappingAnnotation(violations, c, m, m.getAnnotation(GetMapping.class));
                checkMappingAnnotation(violations, c, m, m.getAnnotation(PostMapping.class));
                checkMappingAnnotation(violations, c, m, m.getAnnotation(PutMapping.class));
                checkMappingAnnotation(violations, c, m, m.getAnnotation(DeleteMapping.class));
                checkMappingAnnotation(violations, c, m, m.getAnnotation(PatchMapping.class));
            }
        }
        if (!violations.isEmpty()) {
            fail("Path convention violations:\n" + String.join("\n", violations));
        }
    }

    private static void checkMappingAnnotation(List<String> violations, Class<?> c, Method m, RequestMapping ann) {
        if (ann == null) return;
        for (String p : ann.path().length > 0 ? ann.path() : ann.value()) {
            if (p == null) continue;
            if (p.startsWith("/api") || p.startsWith("/v1") || p.startsWith("/api/v1")) {
                violations.add(c.getSimpleName() + "#" + m.getName() + ": path must be resource-relative: " + p);
            }
        }
    }

    private static void checkMappingAnnotation(List<String> violations, Class<?> c, Method m, GetMapping ann) {
        if (ann == null) return;
        for (String p : ann.path().length > 0 ? ann.path() : ann.value()) {
            if (p == null) continue;
            if (p.startsWith("/api") || p.startsWith("/v1") || p.startsWith("/api/v1")) {
                violations.add(c.getSimpleName() + "#" + m.getName() + ": path must be resource-relative: " + p);
            }
        }
    }

    private static void checkMappingAnnotation(List<String> violations, Class<?> c, Method m, PostMapping ann) {
        if (ann == null) return;
        for (String p : ann.path().length > 0 ? ann.path() : ann.value()) {
            if (p == null) continue;
            if (p.startsWith("/api") || p.startsWith("/v1") || p.startsWith("/api/v1")) {
                violations.add(c.getSimpleName() + "#" + m.getName() + ": path must be resource-relative: " + p);
            }
        }
    }

    private static void checkMappingAnnotation(List<String> violations, Class<?> c, Method m, PutMapping ann) {
        if (ann == null) return;
        for (String p : ann.path().length > 0 ? ann.path() : ann.value()) {
            if (p == null) continue;
            if (p.startsWith("/api") || p.startsWith("/v1") || p.startsWith("/api/v1")) {
                violations.add(c.getSimpleName() + "#" + m.getName() + ": path must be resource-relative: " + p);
            }
        }
    }

    private static void checkMappingAnnotation(List<String> violations, Class<?> c, Method m, DeleteMapping ann) {
        if (ann == null) return;
        for (String p : ann.path().length > 0 ? ann.path() : ann.value()) {
            if (p == null) continue;
            if (p.startsWith("/api") || p.startsWith("/v1") || p.startsWith("/api/v1")) {
                violations.add(c.getSimpleName() + "#" + m.getName() + ": path must be resource-relative: " + p);
            }
        }
    }

    private static void checkMappingAnnotation(List<String> violations, Class<?> c, Method m, PatchMapping ann) {
        if (ann == null) return;
        for (String p : ann.path().length > 0 ? ann.path() : ann.value()) {
            if (p == null) continue;
            if (p.startsWith("/api") || p.startsWith("/v1") || p.startsWith("/api/v1")) {
                violations.add(c.getSimpleName() + "#" + m.getName() + ": path must be resource-relative: " + p);
            }
        }
    }
    private static List<Class<?>> scanControllers() throws Exception {
        String[] known = new String[]{
                "com.duanruo.exam.adapter.rest.controller.ApplicationController",
                "com.duanruo.exam.adapter.rest.controller.AuthController",
                "com.duanruo.exam.adapter.rest.controller.ExamAdminController",
                "com.duanruo.exam.adapter.rest.controller.ExamReviewerController",
                "com.duanruo.exam.adapter.rest.controller.FileController",
                "com.duanruo.exam.adapter.rest.controller.PaymentController",
                "com.duanruo.exam.adapter.rest.controller.PublicExamController",
                "com.duanruo.exam.adapter.rest.controller.ReviewController",
                "com.duanruo.exam.adapter.rest.controller.ReviewQueueController",
                "com.duanruo.exam.adapter.rest.controller.SeatingController",
                "com.duanruo.exam.adapter.rest.controller.TicketController",
                "com.duanruo.exam.adapter.rest.controller.VenueController",
                "com.duanruo.exam.adapter.rest.controller.ExamController",
                "com.duanruo.exam.adapter.rest.controller.ReviewStatsController"
        };
        List<Class<?>> list = new ArrayList<>();
        for (String k : known) {
            try { list.add(Class.forName(k)); } catch (ClassNotFoundException ignore) {}
        }
        return list;
    }

}

