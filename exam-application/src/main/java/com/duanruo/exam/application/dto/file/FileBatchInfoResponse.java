package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

@Schema(name = "FileBatchInfoResponse", description = "批量文件信息响应")
public record FileBatchInfoResponse(
        @Schema(description = "文件信息列表")
        List<FileInfoResponse> files,
        
        @Schema(description = "总数量", example = "2")
        int totalCount,
        
        @Schema(description = "请求者", example = "candidate1")
        String requestedBy,
        
        @Schema(description = "请求时间", example = "2024-01-01T12:00:00")
        LocalDateTime requestedAt
) {}
