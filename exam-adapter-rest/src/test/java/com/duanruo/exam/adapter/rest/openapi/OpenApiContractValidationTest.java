package com.duanruo.exam.adapter.rest.openapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiContractValidationTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void openapi_json_should_be_valid_and_paths_follow_conventions() throws Exception {
        Path path = Path.of("..", "docs", "openapi", "openapi-v1.json");
        File file = path.toFile();
        assertThat(file).as("OpenAPI file exists").exists();

        JsonNode root = mapper.readTree(file);
        assertThat(root.get("openapi").asText()).startsWith("3.");
        assertThat(root.path("servers").isArray()).isTrue();
        assertThat(root.path("servers").get(0).path("url").asText()).isEqualTo("/api/v1");

        JsonNode paths = root.path("paths");
        assertThat(paths.isObject()).isTrue();
        Iterator<String> it = paths.fieldNames();
        while (it.hasNext()) {
            String p = it.next();
            // path keys must be resource-relative (no /api or /v1 prefix)
            assertThat(p).doesNotStartWith("/api");
            assertThat(p).doesNotStartWith("/v1");
        }

        // minimal presence checks for newly added endpoints
        Set<String> required = Set.of(
                "/payments/initiate",
                "/payments/callback",
                "/reviews/queue/pull",
                "/reviews/tasks/{taskId}/heartbeat",
                "/reviews/tasks/{taskId}/release",
                "/reviews/tasks/{taskId}/decision",
                "/reviews/tasks/{taskId}/assignee",
                "/reviews/stats/me",
                "/users/directory/resolve",
                "/users/{userId}/display-name",
                "/exams/{examId}/reviewers",
                "/exams/{examId}/reviewers/{reviewerId}"
        );
        for (String r : required) {
            assertThat(paths.has(r)).as("paths contains " + r).isTrue();
        }

        // ensure /payments/callback 200 response has 'idempotent' boolean property
        JsonNode callback = paths.path("/payments/callback").path("post");
        JsonNode idempotent = callback.path("responses").path("200").path("content")
                .path("application/json").path("schema").path("properties").path("idempotent");
        assertThat(idempotent.isMissingNode()).isFalse();
        assertThat(idempotent.path("type").asText()).isEqualTo("boolean");
    }
}

