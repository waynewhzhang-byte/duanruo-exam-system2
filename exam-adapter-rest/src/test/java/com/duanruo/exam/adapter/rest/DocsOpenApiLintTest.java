package com.duanruo.exam.adapter.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Paths;
import java.util.Iterator;

import static org.junit.jupiter.api.Assertions.*;

public class DocsOpenApiLintTest {

    private File openapiFile() {
        return Paths.get("..","docs", "openapi", "openapi-v1.json").toFile();
    }

    @Test
    void pathsShouldBeResourceRelative_NoApiOrVersionPrefixes() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(openapiFile());
        JsonNode paths = root.get("paths");
        assertNotNull(paths, "openapi.paths missing");
        Iterator<String> it = paths.fieldNames();
        while (it.hasNext()) {
            String p = it.next();
            assertFalse(p.startsWith("/api"), () -> "Path should not start with '/api': " + p);
            assertFalse(p.startsWith("/v1"), () -> "Path should not start with '/v1': " + p);
        }
    }

    @Test
    void mustContainRulesEndpointsAndTicketDelete() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(openapiFile());
        JsonNode paths = root.get("paths");
        assertNotNull(paths);
        assertTrue(paths.has("/exams/{id}/rules"), "Missing /exams/{id}/rules path");
        JsonNode ticketTpl = paths.get("/tickets/exam/{examId}/template");
        assertNotNull(ticketTpl, "Missing /tickets/exam/{examId}/template path");
        assertNotNull(ticketTpl.get("delete"), "Missing DELETE on /tickets/exam/{examId}/template");
    }
}

