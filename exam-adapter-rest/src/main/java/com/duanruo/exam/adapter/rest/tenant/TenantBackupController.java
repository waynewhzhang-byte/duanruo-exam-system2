package com.duanruo.exam.adapter.rest.tenant;

import com.duanruo.exam.application.tenant.*;
import com.duanruo.exam.shared.domain.TenantId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 租户备份管理控制器
 */
@RestController
@RequestMapping("/tenants/{tenantId}/backups")
@Tag(name = "租户备份管理", description = "租户数据备份和恢复API")
public class TenantBackupController {
    
    private final TenantBackupService backupService;
    
    public TenantBackupController(TenantBackupService backupService) {
        this.backupService = backupService;
    }
    
    @PostMapping
    @Operation(summary = "创建租户备份", description = "创建租户的全量数据备份")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> createBackup(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId
    ) {
        UUID backupId = backupService.createFullBackup(TenantId.of(tenantId));
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "备份任务已创建",
            "data", Map.of(
                "backupId", backupId,
                "status", "IN_PROGRESS"
            )
        ));
    }
    
    @GetMapping
    @Operation(summary = "获取租户备份列表", description = "获取指定租户的所有备份记录")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getTenantBackups(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId
    ) {
        List<TenantBackupDTO> backups = backupService.getTenantBackups(TenantId.of(tenantId));
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "success",
            "data", backups
        ));
    }
    
    @GetMapping("/{backupId}")
    @Operation(summary = "获取备份详情", description = "获取指定备份的详细信息")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getBackupDetails(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId,
        @Parameter(description = "备份ID") @PathVariable UUID backupId
    ) {
        TenantBackupDTO backup = backupService.getBackupDetails(backupId);
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "success",
            "data", backup
        ));
    }
    
    @GetMapping("/latest")
    @Operation(summary = "获取最新备份", description = "获取租户的最新备份记录")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getLatestBackup(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId
    ) {
        TenantBackupDTO backup = backupService.getLatestBackup(TenantId.of(tenantId));
        
        if (backup == null) {
            return ResponseEntity.ok(Map.of(
                "code", 404,
                "message", "未找到备份记录",
                "data", (Object) null
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "success",
            "data", backup
        ));
    }
    
    @GetMapping("/{backupId}/progress")
    @Operation(summary = "获取备份进度", description = "获取备份任务的执行进度")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getBackupProgress(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId,
        @Parameter(description = "备份ID") @PathVariable UUID backupId
    ) {
        BackupProgress progress = backupService.getBackupProgress(backupId);
        
        if (progress == null) {
            return ResponseEntity.ok(Map.of(
                "code", 404,
                "message", "未找到备份进度信息",
                "data", (Object) null
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "success",
            "data", progress
        ));
    }
    
    @PostMapping("/{backupId}/restore")
    @Operation(summary = "从备份恢复数据", description = "从指定备份恢复租户数据")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> restoreFromBackup(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId,
        @Parameter(description = "备份ID") @PathVariable UUID backupId,
        @RequestBody RestoreRequest request
    ) {
        UUID targetTenantId = request.getTargetTenantId();
        boolean overwrite = request.isOverwrite();
        
        UUID restoreTaskId = backupService.restoreFromBackup(
            backupId,
            targetTenantId != null ? TenantId.of(targetTenantId) : null,
            overwrite
        );
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "恢复任务已创建",
            "data", Map.of(
                "restoreTaskId", restoreTaskId,
                "status", "IN_PROGRESS"
            )
        ));
    }
    
    @GetMapping("/restore/{restoreTaskId}/progress")
    @Operation(summary = "获取恢复进度", description = "获取恢复任务的执行进度")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getRestoreProgress(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId,
        @Parameter(description = "恢复任务ID") @PathVariable UUID restoreTaskId
    ) {
        RestoreProgress progress = backupService.getRestoreProgress(restoreTaskId);
        
        if (progress == null) {
            return ResponseEntity.ok(Map.of(
                "code", 404,
                "message", "未找到恢复进度信息",
                "data", (Object) null
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "success",
            "data", progress
        ));
    }
    
    @PostMapping("/{backupId}/validate")
    @Operation(summary = "验证备份完整性", description = "验证备份文件的完整性和可用性")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> validateBackup(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId,
        @Parameter(description = "备份ID") @PathVariable UUID backupId
    ) {
        BackupValidationResult result = backupService.validateBackup(backupId);
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "success",
            "data", result
        ));
    }
    
    @DeleteMapping("/{backupId}")
    @Operation(summary = "删除备份", description = "删除指定的备份记录和文件")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteBackup(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId,
        @Parameter(description = "备份ID") @PathVariable UUID backupId
    ) {
        backupService.deleteBackup(backupId);
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "备份已删除"
        ));
    }
    
    @PostMapping("/cleanup")
    @Operation(summary = "清理过期备份", description = "清理超过保留期限的备份")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> cleanupExpiredBackups(
        @Parameter(description = "租户ID") @PathVariable UUID tenantId,
        @RequestParam(defaultValue = "30") int retentionDays
    ) {
        int count = backupService.cleanupExpiredBackups(retentionDays);
        
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "清理完成",
            "data", Map.of(
                "cleanedCount", count,
                "retentionDays", retentionDays
            )
        ));
    }
    
    /**
     * 恢复请求
     */
    public static class RestoreRequest {
        private UUID targetTenantId;
        private boolean overwrite;
        
        public UUID getTargetTenantId() { return targetTenantId; }
        public void setTargetTenantId(UUID targetTenantId) { this.targetTenantId = targetTenantId; }
        
        public boolean isOverwrite() { return overwrite; }
        public void setOverwrite(boolean overwrite) { this.overwrite = overwrite; }
    }
}

