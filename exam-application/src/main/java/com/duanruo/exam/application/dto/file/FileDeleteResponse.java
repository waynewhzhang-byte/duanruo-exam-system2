package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(name = "FileDeleteResponse", description = "文件删除响应")
public record FileDeleteResponse(
        @Schema(description = "文件ID", example = "123e4567-e89b-12d3-a456-426614174000")
        UUID fileId,
        
        @Schema(description = "文件状态", example = "DELETED")
        String status,
        
        @Schema(description = "删除者", example = "candidate1")
        String deletedBy,
        
        @Schema(description = "消息", example = "文件删除成功")
        String message
) {}
