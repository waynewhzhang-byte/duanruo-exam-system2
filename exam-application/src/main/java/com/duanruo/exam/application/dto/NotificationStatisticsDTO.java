package com.duanruo.exam.application.dto;

import java.util.Map;

/**
 * 通知统计DTO
 */
public record NotificationStatisticsDTO(
        long totalCount,
        long pendingCount,
        long sendingCount,
        long successCount,
        long failedCount,
        Map<String, Long> channelCounts,
        double successRate
) {
}

