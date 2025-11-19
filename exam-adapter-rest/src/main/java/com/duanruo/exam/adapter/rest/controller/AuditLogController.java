package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.AuditLogDTO;
import com.duanruo.exam.application.dto.AuditLogQueryRequest;
import com.duanruo.exam.application.service.AuditLogApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 审计日志Controller
 */
@RestController
@RequestMapping("/audit-logs")
@Tag(name = "审计日志管理", description = "审计日志查询和管理")
public class AuditLogController {
    
    private final AuditLogApplicationService auditLogService;
    
    public AuditLogController(AuditLogApplicationService auditLogService) {
        this.auditLogService = auditLogService;
    }
    
    /**
     * 查询审计日志
     */
    @PostMapping("/query")
    @Operation(summary = "查询审计日志", description = "根据条件查询审计日志")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public List<AuditLogDTO> query(@RequestBody AuditLogQueryRequest request) {
        return auditLogService.query(request);
    }
    
    /**
     * 根据租户ID查询
     */
    @GetMapping("/tenants/{tenantId}")
    @Operation(summary = "查询租户审计日志", description = "查询指定租户的审计日志")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public List<AuditLogDTO> findByTenantId(
        @PathVariable UUID tenantId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return auditLogService.findByTenantId(tenantId, page, size);
    }
    
    /**
     * 根据用户ID查询
     */
    @GetMapping("/users/{userId}")
    @Operation(summary = "查询用户审计日志", description = "查询指定用户的审计日志")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public List<AuditLogDTO> findByUserId(
        @PathVariable UUID userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return auditLogService.findByUserId(userId, page, size);
    }
    
    /**
     * 根据资源查询
     */
    @GetMapping("/resources/{resourceType}/{resourceId}")
    @Operation(summary = "查询资源审计日志", description = "查询指定资源的审计日志")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public List<AuditLogDTO> findByResource(
        @PathVariable String resourceType,
        @PathVariable String resourceId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return auditLogService.findByResource(resourceType, resourceId, page, size);
    }
    
    /**
     * 统计租户审计日志数量
     */
    @GetMapping("/tenants/{tenantId}/count")
    @Operation(summary = "统计租户审计日志数量", description = "统计指定租户的审计日志总数")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public long countByTenantId(@PathVariable UUID tenantId) {
        return auditLogService.countByTenantId(tenantId);
    }
}

