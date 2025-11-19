package com.duanruo.exam.adapter.rest.architecture;

import org.junit.jupiter.api.Test;

import java.io.File;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Enforces OpenAPI annotation style: do NOT use @ApiResponses wrapper.
 * Controllers should use repeated @ApiResponse annotations instead.
 */
public class ApiResponseAnnotationStyleTest {

    @Test
    void noControllerUsesApiResponsesWrapper() throws Exception {
        List<Class<?>> controllers = findClasses("com.duanruo.exam.adapter.rest.controller");
        List<String> offenders = new ArrayList<>();
        for (Class<?> c : controllers) {
            // class level
            if (hasApiResponsesAnnotation(c.getAnnotations())) {
                offenders.add(c.getName() + " (class)");
            }
            // method level
            var methods = c.getDeclaredMethods();
            for (var m : methods) {
                if (hasApiResponsesAnnotation(m.getAnnotations())) {
                    offenders.add(c.getName() + "#" + m.getName());
                }
            }
        }
        assertThat(offenders)
                .withFailMessage("@ApiResponses wrapper is not allowed. Offenders: %s", offenders)
                .isEmpty();
    }

    private static boolean hasApiResponsesAnnotation(java.lang.annotation.Annotation[] annotations) {
        for (var a : annotations) {
            if (a.annotationType().getName().equals("io.swagger.v3.oas.annotations.responses.ApiResponses")) {
                return true;
            }
        }
        return false;
    }

    private static List<Class<?>> findClasses(String basePackage) throws Exception {
        String path = basePackage.replace('.', '/');
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        URL resource = cl.getResource(path);
        if (resource == null) return List.of();
        URI uri = resource.toURI();
        File dir = new File(uri);
        List<Class<?>> classes = new ArrayList<>();
        scanDir(basePackage, dir, classes);
        return classes;
    }

    private static void scanDir(String base, File dir, List<Class<?>> out) throws ClassNotFoundException {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.isDirectory()) {
                scanDir(base + "." + f.getName(), f, out);
            } else if (f.getName().endsWith(".class")) {
                String clsName = base + "." + f.getName().substring(0, f.getName().length() - 6);
                out.add(Class.forName(clsName));
            }
        }
    }
}

