package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.PIIAccessLogDTO;
import com.duanruo.exam.application.service.PIIComplianceApplicationService;
import com.duanruo.exam.domain.pii.PIIAccessType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * PII合规管理控制器
 * 提供PII数据访问审计查询和管理功能
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
@RestController
@RequestMapping("/pii-compliance")
@Tag(name = "PII合规管理", description = "PII数据访问审计和合规管理")
public class PIIComplianceController {
    
    private final PIIComplianceApplicationService complianceService;
    
    public PIIComplianceController(PIIComplianceApplicationService complianceService) {
        this.complianceService = complianceService;
    }
    
    /**
     * 查询用户的PII访问日志
     */
    @GetMapping("/access-logs/users/{userId}")
    @Operation(summary = "查询用户的PII访问日志", description = "查询指定用户在指定时间范围内的PII数据访问记录")
    @PreAuthorize("hasAuthority('PII_AUDIT')")
    public ResponseEntity<List<PIIAccessLogDTO>> getUserAccessLogs(
            @Parameter(description = "用户ID") @PathVariable UUID userId,
            @Parameter(description = "开始时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        
        List<PIIAccessLogDTO> logs = complianceService.getUserAccessLogs(userId, startTime, endTime);
        return ResponseEntity.ok(logs);
    }
    
    /**
     * 查询资源的PII访问日志
     */
    @GetMapping("/access-logs/resources")
    @Operation(summary = "查询资源的PII访问日志", description = "查询指定资源在指定时间范围内的PII数据访问记录")
    @PreAuthorize("hasAuthority('PII_AUDIT')")
    public ResponseEntity<List<PIIAccessLogDTO>> getResourceAccessLogs(
            @Parameter(description = "资源类型") @RequestParam String resourceType,
            @Parameter(description = "资源ID") @RequestParam String resourceId,
            @Parameter(description = "开始时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        
        List<PIIAccessLogDTO> logs = complianceService.getResourceAccessLogs(resourceType, resourceId, startTime, endTime);
        return ResponseEntity.ok(logs);
    }
    
    /**
     * 查询特定类型的PII访问日志
     */
    @GetMapping("/access-logs/types/{accessType}")
    @Operation(summary = "查询特定类型的PII访问日志", description = "查询指定访问类型在指定时间范围内的PII数据访问记录")
    @PreAuthorize("hasAuthority('PII_AUDIT')")
    public ResponseEntity<List<PIIAccessLogDTO>> getAccessLogsByType(
            @Parameter(description = "访问类型") @PathVariable PIIAccessType accessType,
            @Parameter(description = "开始时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        
        List<PIIAccessLogDTO> logs = complianceService.getAccessLogsByType(accessType, startTime, endTime);
        return ResponseEntity.ok(logs);
    }
    
    /**
     * 查询所有PII访问日志（分页）
     */
    @GetMapping("/access-logs")
    @Operation(summary = "查询所有PII访问日志", description = "分页查询指定时间范围内的所有PII数据访问记录")
    @PreAuthorize("hasAuthority('PII_AUDIT')")
    public ResponseEntity<List<PIIAccessLogDTO>> getAllAccessLogs(
            @Parameter(description = "开始时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime,
            @Parameter(description = "页码（从0开始）") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        
        List<PIIAccessLogDTO> logs = complianceService.getAllAccessLogs(startTime, endTime, page, size);
        return ResponseEntity.ok(logs);
    }
    
    /**
     * 统计PII访问次数
     */
    @GetMapping("/access-logs/count")
    @Operation(summary = "统计PII访问次数", description = "统计指定条件下的PII数据访问次数")
    @PreAuthorize("hasAuthority('PII_AUDIT')")
    public ResponseEntity<Long> countAccess(
            @Parameter(description = "用户ID（可选）") @RequestParam(required = false) UUID userId,
            @Parameter(description = "资源类型（可选）") @RequestParam(required = false) String resourceType,
            @Parameter(description = "开始时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        
        long count = complianceService.countAccess(userId, resourceType, startTime, endTime);
        return ResponseEntity.ok(count);
    }
    
    /**
     * 清理过期的PII访问日志
     */
    @DeleteMapping("/access-logs/cleanup")
    @Operation(summary = "清理过期的PII访问日志", description = "删除超过保留期限的PII访问日志")
    @PreAuthorize("hasAuthority('PII_AUDIT')")
    public ResponseEntity<Integer> cleanupOldLogs(
            @Parameter(description = "保留天数") @RequestParam(defaultValue = "365") int retentionDays) {
        
        int deleted = complianceService.cleanupOldLogs(retentionDays);
        return ResponseEntity.ok(deleted);
    }
}

