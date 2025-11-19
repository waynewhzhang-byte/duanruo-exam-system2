package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(name = "FileUploadConfirmResponse", description = "文件上传确认响应")
public record FileUploadConfirmResponse(
        @Schema(description = "文件ID", example = "123e4567-e89b-12d3-a456-426614174000")
        UUID fileId,
        
        @Schema(description = "文件状态", example = "UPLOADED")
        String status,
        
        @Schema(description = "文件名", example = "resume.pdf")
        String fileName,
        
        @Schema(description = "文件大小", example = "1024000")
        Long fileSize,
        
        @Schema(description = "内容类型", example = "application/pdf")
        String contentType,
        
        @Schema(description = "病毒扫描状态", example = "PENDING")
        String virusScanStatus,
        
        @Schema(description = "上传时间", example = "2024-01-01T12:00:00")
        LocalDateTime uploadedAt,
        
        @Schema(description = "消息", example = "文件上传确认成功")
        String message
) {}
