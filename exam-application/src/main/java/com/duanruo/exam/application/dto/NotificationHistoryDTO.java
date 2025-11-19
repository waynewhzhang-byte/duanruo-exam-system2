package com.duanruo.exam.application.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 通知历史DTO
 */
public record NotificationHistoryDTO(
        UUID id,
        String templateCode,
        String channel,
        String recipient,
        UUID recipientUserId,
        String subject,
        String content,
        Map<String, Object> variables,
        String status,
        String errorMessage,
        LocalDateTime sentAt,
        LocalDateTime deliveredAt,
        Integer retryCount,
        LocalDateTime createdAt
) {
}

