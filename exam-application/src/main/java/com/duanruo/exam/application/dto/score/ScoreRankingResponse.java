package com.duanruo.exam.application.dto.score;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * 成绩排名响应DTO
 */
public record ScoreRankingResponse(
        UUID applicationId,
        String candidateName,
        String idCard,
        String ticketNo,
        UUID positionId,
        String positionName,
        BigDecimal totalScore,
        Integer rank,
        Boolean isTied,
        Boolean isInterviewEligible,
        Long totalCandidates
) {
}

