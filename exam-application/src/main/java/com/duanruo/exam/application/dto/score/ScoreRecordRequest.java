package com.duanruo.exam.application.dto.score;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * 成绩录入请求DTO
 */
public record ScoreRecordRequest(
        @NotNull(message = "申请ID不能为空")
        UUID applicationId,
        
        @NotNull(message = "科目ID不能为空")
        UUID subjectId,
        
        @NotNull(message = "成绩不能为空")
        @DecimalMin(value = "0.0", message = "成绩不能为负数")
        @DecimalMax(value = "999.99", message = "成绩不能超过999.99")
        BigDecimal score,
        
        String remarks
) {
}
