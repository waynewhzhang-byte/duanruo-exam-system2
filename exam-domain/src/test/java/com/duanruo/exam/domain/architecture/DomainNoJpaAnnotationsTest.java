package com.duanruo.exam.domain.architecture;

import org.junit.jupiter.api.Test;

import java.io.File;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Architecture test: forbid JPA annotations in domain layer.
 */
public class DomainNoJpaAnnotationsTest {

    @Test
    void domainClassesShouldNotUseJpaAnnotations() throws Exception {
        List<Class<?>> classes = findClasses("com.duanruo.exam.domain");
        List<String> violations = new ArrayList<>();
        for (Class<?> cls : classes) {
            for (var a : cls.getAnnotations()) {
                String name = a.annotationType().getName();
                if (name.startsWith("jakarta.persistence.")) {
                    violations.add(cls.getName() + " annotated with @" + a.annotationType().getSimpleName());
                }
            }
        }
        assertThat(violations)
                .withFailMessage("Domain layer must not use JPA annotations, but found: %s", violations)
                .isEmpty();
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

