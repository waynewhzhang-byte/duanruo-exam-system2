package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "FileUploadUrlRequest", description = "文件上传URL请求")
public record FileUploadUrlRequest(
        @Schema(description = "文件名", example = "resume.pdf")
        @NotBlank
        String fileName,

        @Schema(description = "内容类型", example = "application/pdf")
        @NotBlank
        String contentType,

        @Schema(description = "字段键", example = "resume")
        @NotBlank
        String fieldKey
) {}

