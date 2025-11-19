package com.duanruo.exam.application.dto.score;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * 成绩统计响应DTO
 */
public record ScoreStatisticsResponse(
        UUID examId,
        Long totalCount,
        Long validCount,
        Long absentCount,
        BigDecimal averageScore,
        BigDecimal maxScore,
        BigDecimal minScore
) {
}
