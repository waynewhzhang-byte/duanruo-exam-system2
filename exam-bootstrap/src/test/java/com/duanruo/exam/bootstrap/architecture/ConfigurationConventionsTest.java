package com.duanruo.exam.bootstrap.architecture;

import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Configuration conventions gate: context-path and Jackson date/time format.
 * Pure file-based assertion to avoid Spring context startup in unit tests.
 */
public class ConfigurationConventionsTest {

    @Test
    void applicationYamlShouldRespectApiV1AndShanghaiTimezone() throws Exception {
        String yaml = readClasspathFile("application.yml");
        assertThat(yaml).contains("context-path: /api/v1");
        assertThat(yaml).contains("time-zone: Asia/Shanghai");
        assertThat(yaml).contains("date-format: yyyy-MM-dd HH:mm:ss");
    }

    private String readClasspathFile(String name) throws Exception {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        try (InputStream is = cl.getResourceAsStream(name)) {
            if (is == null) throw new IllegalStateException("Resource not found: " + name);
            try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                return br.lines().collect(Collectors.joining("\n"));
            }
        }
    }
}

