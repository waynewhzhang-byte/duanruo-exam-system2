package com.duanruo.exam.adapter.rest.architecture;

import org.junit.jupiter.api.Test;
import com.duanruo.exam.adapter.rest.controller.*;

import java.lang.annotation.Annotation;
import java.lang.reflect.AnnotatedElement;
import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Contract enforcement: controllers must use resource-relative paths.
 * No mapping value/path should start with "/api" or "/v1".
 * Pure reflection, no Spring context required.
 */
class ApiPathConventionsTest {

    private static final List<Class<?>> CONTROLLERS = List.of(
            FileController.class,
            PositionController.class,
            ExamController.class,
            ApplicationController.class,
            ReviewController.class,
            TicketController.class,
            AuthController.class,
            ReviewStatsController.class
    );

    private static final List<Class<? extends Annotation>> MAPPING_ANNOS = List.of(
            org.springframework.web.bind.annotation.RequestMapping.class,
            org.springframework.web.bind.annotation.GetMapping.class,
            org.springframework.web.bind.annotation.PostMapping.class,
            org.springframework.web.bind.annotation.PutMapping.class,
            org.springframework.web.bind.annotation.DeleteMapping.class,
            org.springframework.web.bind.annotation.PatchMapping.class
    );

    @Test
    void mappings_should_not_start_with_api_or_v1() {
        for (Class<?> controller : CONTROLLERS) {
            // class-level
            for (Class<? extends Annotation> annoType : MAPPING_ANNOS) {
                if (controller.isAnnotationPresent(annoType)) {
                    assertAnnotationValues(controller, controller.getAnnotation(annoType));
                }
            }
            // method-level
            for (Method m : controller.getDeclaredMethods()) {
                for (Class<? extends Annotation> annoType : MAPPING_ANNOS) {
                    if (m.isAnnotationPresent(annoType)) {
                        assertAnnotationValues(m, m.getAnnotation(annoType));
                    }
                }
            }
        }
    }

    private static void assertAnnotationValues(AnnotatedElement element, Annotation mappingAnno) {
        String where = (element instanceof Class<?> c) ? c.getName() : ((Method) element).getDeclaringClass().getName() + "#" + ((Method) element).getName();
        // Check both "value" and "path" attributes if present
        checkArrayAttribute(mappingAnno, "value", where);
        checkArrayAttribute(mappingAnno, "path", where);
    }

    private static void checkArrayAttribute(Annotation anno, String attr, String where) {
        try {
            Method attrMethod = anno.annotationType().getMethod(attr);
            Object val = attrMethod.invoke(anno);
            if (val instanceof String s) {
                assertPathValid(s, where, attr);
            } else if (val instanceof String[] arr) {
                for (String s : arr) assertPathValid(s, where, attr);
            }
        } catch (NoSuchMethodException ignored) {
            // attribute not present on this mapping
        } catch (Exception e) {
            throw new RuntimeException("Failed reading @" + anno.annotationType().getSimpleName() + "." + attr + " on " + where, e);
        }
    }

    private static void assertPathValid(String s, String where, String attr) {
        if (s == null || s.isBlank()) return;
        boolean invalid = s.startsWith("/api") || s.startsWith("/v1");
        assertThat(invalid)
                .as("%s: mapping %s='%s' must NOT start with '/api' or '/v1'", where, attr, s)
                .isFalse();
    }
}

