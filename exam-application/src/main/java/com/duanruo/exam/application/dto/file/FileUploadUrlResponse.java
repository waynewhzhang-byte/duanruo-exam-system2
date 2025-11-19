package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(name = "FileUploadUrlResponse", description = "文件上传URL响应")
public record FileUploadUrlResponse(
        @Schema(description = "文件ID", example = "123e4567-e89b-12d3-a456-426614174000")
        UUID fileId,

        @Schema(description = "上传URL", example = "https://minio.example.com/exam-uploads/...")
        String uploadUrl,

        @Schema(description = "文件键", example = "uploads/candidate1/resume/123e4567-e89b-12d3-a456-426614174000.pdf")
        String fileKey,

        @Schema(description = "文件名", example = "resume.pdf")
        String fileName,

        @Schema(description = "内容类型", example = "application/pdf")
        String contentType,

        @Schema(description = "字段键", example = "resume")
        String fieldKey,

        @Schema(description = "过期时间（秒）", example = "3600")
        int expiresIn
) {}

