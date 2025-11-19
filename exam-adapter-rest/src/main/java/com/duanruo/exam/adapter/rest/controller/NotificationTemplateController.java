package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import com.duanruo.exam.application.dto.NotificationTemplateDTO;
import com.duanruo.exam.application.service.NotificationTemplateApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 通知模板管理控制器
 */
@RestController
@RequestMapping("/notification-templates")
@Tag(name = "通知模板管理", description = "通知模板的CRUD和预览功能")
public class NotificationTemplateController {

    private final NotificationTemplateApplicationService templateService;

    public NotificationTemplateController(NotificationTemplateApplicationService templateService) {
        this.templateService = templateService;
    }

    @Operation(summary = "创建通知模板", description = "创建新的通知模板")
    @ApiResponse(responseCode = "201", description = "Created")
    @PostMapping
    @PreAuthorize("hasAuthority('TEMPLATE_CREATE')")
    public ResponseEntity<NotificationTemplateDTO> create(
            @RequestBody Map<String, Object> body,
            @CurrentUserId UUID userId) {
        
        String code = (String) body.get("code");
        String name = (String) body.get("name");
        String channel = (String) body.get("channel");
        String subject = (String) body.get("subject");
        String content = (String) body.get("content");

        NotificationTemplateDTO template = templateService.create(
            code, name, channel, subject, content, userId.toString()
        );

        return ResponseEntity.status(201).body(template);
    }

    @Operation(summary = "更新通知模板", description = "更新现有通知模板")
    @ApiResponse(responseCode = "200", description = "OK")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('TEMPLATE_UPDATE')")
    public ResponseEntity<NotificationTemplateDTO> update(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, Object> body,
            @CurrentUserId UUID userId) {
        
        String name = (String) body.get("name");
        String subject = (String) body.get("subject");
        String content = (String) body.get("content");

        NotificationTemplateDTO template = templateService.update(
            id, name, subject, content, userId.toString()
        );

        return ResponseEntity.ok(template);
    }

    @Operation(summary = "激活模板", description = "激活指定的通知模板")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('TEMPLATE_UPDATE')")
    public ResponseEntity<Map<String, String>> activate(
            @PathVariable("id") UUID id,
            @CurrentUserId UUID userId) {
        
        templateService.activate(id, userId.toString());
        return ResponseEntity.ok(Map.of("message", "模板已激活"));
    }

    @Operation(summary = "停用模板", description = "停用指定的通知模板")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('TEMPLATE_UPDATE')")
    public ResponseEntity<Map<String, String>> deactivate(
            @PathVariable("id") UUID id,
            @CurrentUserId UUID userId) {
        
        templateService.deactivate(id, userId.toString());
        return ResponseEntity.ok(Map.of("message", "模板已停用"));
    }

    @Operation(summary = "删除模板", description = "删除指定的通知模板")
    @ApiResponse(responseCode = "204", description = "No Content")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('TEMPLATE_DELETE')")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "获取模板详情", description = "根据ID获取通知模板详情")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('TEMPLATE_LIST')")
    public ResponseEntity<NotificationTemplateDTO> getById(@PathVariable("id") UUID id) {
        NotificationTemplateDTO template = templateService.getById(id);
        return ResponseEntity.ok(template);
    }

    @Operation(summary = "根据代码获取模板", description = "根据模板代码获取通知模板")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/code/{code}")
    @PreAuthorize("hasAuthority('TEMPLATE_LIST')")
    public ResponseEntity<NotificationTemplateDTO> getByCode(@PathVariable("code") String code) {
        NotificationTemplateDTO template = templateService.getByCode(code);
        return ResponseEntity.ok(template);
    }

    @Operation(summary = "根据渠道获取模板列表", description = "获取指定渠道的所有通知模板")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/channel/{channel}")
    @PreAuthorize("hasAuthority('TEMPLATE_LIST')")
    public ResponseEntity<Map<String, Object>> listByChannel(
            @Parameter(description = "通知渠道", example = "email")
            @PathVariable("channel") String channel) {
        
        List<NotificationTemplateDTO> templates = templateService.listByChannel(channel);
        return ResponseEntity.ok(Map.of(
            "items", templates,
            "total", templates.size()
        ));
    }

    @Operation(summary = "根据状态获取模板列表", description = "获取指定状态的所有通知模板")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('TEMPLATE_LIST')")
    public ResponseEntity<Map<String, Object>> listByStatus(
            @Parameter(description = "模板状态", example = "active")
            @PathVariable("status") String status) {
        
        List<NotificationTemplateDTO> templates = templateService.listByStatus(status);
        return ResponseEntity.ok(Map.of(
            "items", templates,
            "total", templates.size()
        ));
    }

    @Operation(summary = "获取所有模板", description = "获取所有通知模板列表")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping
    @PreAuthorize("hasAuthority('TEMPLATE_LIST')")
    public ResponseEntity<Map<String, Object>> listAll() {
        List<NotificationTemplateDTO> templates = templateService.listAll();
        return ResponseEntity.ok(Map.of(
            "items", templates,
            "total", templates.size()
        ));
    }

    @Operation(summary = "预览模板", description = "使用提供的变量值预览渲染后的模板")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/{id}/preview")
    @PreAuthorize("hasAuthority('TEMPLATE_LIST')")
    public ResponseEntity<Map<String, String>> preview(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, Object> variables) {
        
        Map<String, String> preview = templateService.preview(id, variables);
        return ResponseEntity.ok(preview);
    }
}

