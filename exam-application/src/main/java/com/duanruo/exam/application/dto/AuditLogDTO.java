package com.duanruo.exam.application.dto;

import com.duanruo.exam.domain.audit.AuditAction;
import com.duanruo.exam.domain.audit.AuditResult;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 审计日志DTO
 */
public record AuditLogDTO(
    UUID id,
    UUID tenantId,
    UUID userId,
    String username,
    AuditAction action,
    String resourceType,
    String resourceId,
    String requiredPermission,
    AuditResult result,
    String ipAddress,
    String userAgent,
    String requestMethod,
    String requestPath,
    String requestParams,
    String responseStatus,
    String errorMessage,
    LocalDateTime timestamp,
    Long executionTimeMs
) {
}

