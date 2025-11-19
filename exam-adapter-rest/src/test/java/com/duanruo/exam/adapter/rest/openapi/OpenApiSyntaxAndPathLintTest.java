package com.duanruo.exam.adapter.rest.openapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class OpenApiSyntaxAndPathLintTest {

    @Test
    void openapi_json_should_have_valid_syntax_and_paths_follow_conventions() throws Exception {
        File file = Path.of("..", "docs", "openapi", "openapi-v1.json").toFile();
        assertTrue(file.exists(), "OpenAPI file not found: " + file.getAbsolutePath());

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(file);
        assertNotNull(root, "OpenAPI JSON should parse");

        JsonNode paths = root.get("paths");
        assertNotNull(paths, "OpenAPI must contain 'paths'");
        assertTrue(paths.fieldNames().hasNext(), "OpenAPI 'paths' must not be empty");

        // 路径命名规范：不得包含 /api 或 /v1；必须以 / 开头
        Iterator<String> it = paths.fieldNames();
        while (it.hasNext()) {
            String p = it.next();
            assertTrue(p.startsWith("/"), "Path must start with '/': " + p);
            assertFalse(p.startsWith("/api"), "Path must NOT include '/api' prefix: " + p);
            assertFalse(p.contains("/v1"), "Path must NOT include version segment '/v1': " + p);
        }

        // 必含路径（关键契约）
        Set<String> required = Set.of(
                "/payments/initiate",
                "/payments/callback",
                "/reviews/queue/pull",
                "/reviews/tasks/{taskId}/heartbeat",
                "/reviews/tasks/{taskId}/release",
                "/reviews/tasks/{taskId}/decision",
                "/reviews/tasks/{taskId}/assignee",
                "/reviews/stats/me",
                "/applications/{id}",
                "/applications/{id}/reviews",
                "/applications/drafts",
                "/applications/drafts/{id}",
                "/applications/drafts/my"
        );
        for (String r : required) {
            assertTrue(paths.has(r), "Missing required path in OpenAPI: " + r);
        }
    }
}

