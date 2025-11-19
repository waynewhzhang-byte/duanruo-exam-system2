package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.UserDirectoryApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/users")
@Tag(name = "用户目录", description = "用户名称解析、目录查询")
public class UserDirectoryController {

    private final UserDirectoryApplicationService directoryService;

    public UserDirectoryController(UserDirectoryApplicationService directoryService) {
        this.directoryService = directoryService;
    }

    public static record ResolveRequest(List<UUID> ids) {}

    @Operation(summary = "批量解析显示名")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/directory/resolve")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> resolve(@RequestBody ResolveRequest req) {
        Map<UUID, String> map = directoryService.resolveDisplayNames(req.ids());
        List<Map<String, String>> entries = map.entrySet().stream()
                .map(e -> Map.of("id", e.getKey().toString(), "displayName", e.getValue()))
                .toList();
        return ResponseEntity.ok(Map.of("entries", entries, "total", entries.size()));
    }

    @Operation(summary = "查询单个显示名")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/{userId}/display-name")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> displayName(@PathVariable("userId") UUID userId) {
        String name = directoryService.resolveDisplayName(userId);
        return ResponseEntity.ok(Map.of("id", userId.toString(), "displayName", name));
    }
}

