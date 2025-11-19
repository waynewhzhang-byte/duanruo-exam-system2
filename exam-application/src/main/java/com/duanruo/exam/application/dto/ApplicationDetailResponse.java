package com.duanruo.exam.application.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 申请详情响应（包含 payload 等详细信息）
 */
public record ApplicationDetailResponse(
        UUID id,
        UUID examId,
        UUID positionId,
        UUID candidateId,
        Integer formVersion,
        Map<String, Object> payload,
        String status,
        Map<String, Object> autoCheckResult,
        Map<String, Object> finalDecision,
        LocalDateTime submittedAt,
        LocalDateTime statusUpdatedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

