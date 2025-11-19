package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(name = "ApplicationListItemResponse", description = "报名申请列表项（含可读标题）")
public record ApplicationListItemResponse(
        @Schema(description = "申请ID") UUID id,
        @Schema(description = "考试ID") UUID examId,
        @Schema(description = "岗位ID") UUID positionId,
        @Schema(description = "候选人用户ID") UUID candidateId,
        @Schema(description = "表单版本") Integer formVersion,
        @Schema(description = "状态") String status,
        @Schema(description = "提交时间") LocalDateTime submittedAt,
        @Schema(description = "考试标题") String examTitle,
        @Schema(description = "岗位标题") String positionTitle
) {}

