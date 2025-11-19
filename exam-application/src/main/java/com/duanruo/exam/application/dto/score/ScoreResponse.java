package com.duanruo.exam.application.dto.score;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 成绩响应DTO
 */
public record ScoreResponse(
                UUID id,
                UUID applicationId,
                UUID subjectId,
                BigDecimal score,
                Boolean isAbsent,
                UUID gradedBy,
                LocalDateTime gradedAt,
                String remarks,
                String subjectName,
                BigDecimal totalScore) {
        /**
         * 向后兼容的构造函数（不包含科目名称和总分）
         */
        public ScoreResponse(UUID id, UUID applicationId, UUID subjectId,
                        BigDecimal score, Boolean isAbsent, UUID gradedBy,
                        LocalDateTime gradedAt, String remarks) {
                this(id, applicationId, subjectId, score, isAbsent, gradedBy, gradedAt, remarks, null, null);
        }
}
