package com.duanruo.exam.application.dto.score;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * 标记缺考请求DTO
 */
public record AbsentMarkRequest(
        @NotNull(message = "申请ID不能为空")
        UUID applicationId,
        
        @NotNull(message = "科目ID不能为空")
        UUID subjectId,
        
        String remarks
) {
}
