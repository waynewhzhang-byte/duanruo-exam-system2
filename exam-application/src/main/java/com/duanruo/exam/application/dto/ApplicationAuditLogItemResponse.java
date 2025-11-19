package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "申请审计日志条目")
public record ApplicationAuditLogItemResponse(
        @Schema(description = "日志ID") UUID id,
        @Schema(description = "申请ID") UUID applicationId,
        @Schema(description = "原状态") String fromStatus,
        @Schema(description = "新状态") String toStatus,
        @Schema(description = "执行人") String actor,
        @Schema(description = "原因/备注") String reason,
        @Schema(description = "元数据(JSON字符串)") String metadata,
        @Schema(description = "创建时间，Asia/Shanghai") LocalDateTime createdAt
) {}

