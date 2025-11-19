package com.duanruo.exam.application.dto;

import com.duanruo.exam.domain.pii.PIIAccessType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PII访问日志DTO
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
public record PIIAccessLogDTO(
        UUID id,
        UUID userId,
        String username,
        String userRole,
        String resourceType,
        String resourceId,
        String fieldName,
        String fieldType,
        PIIAccessType accessType,
        LocalDateTime accessedAt,
        String ipAddress,
        String source,
        boolean masked,
        String purpose
) {
}

