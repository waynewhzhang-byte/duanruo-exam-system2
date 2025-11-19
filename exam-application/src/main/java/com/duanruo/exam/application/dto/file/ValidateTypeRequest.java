package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "ValidateTypeRequest", description = "文件类型验证请求")
public record ValidateTypeRequest(
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

