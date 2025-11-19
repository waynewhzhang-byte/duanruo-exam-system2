package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Schema(name = "FileUploadConfirmRequest", description = "文件上传确认请求")
public record FileUploadConfirmRequest(
        @Schema(description = "文件名", example = "resume.pdf")
        String fileName,
        
        @Schema(description = "文件大小（字节）", example = "1024000")
        @NotNull @Positive
        Long fileSize,
        
        @Schema(description = "内容类型", example = "application/pdf")
        String contentType
) {}
