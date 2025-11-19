package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(name = "ValidateTypeResponse", description = "文件类型验证响应")
public record ValidateTypeResponse(
        @Schema(description = "是否有效", example = "true")
        boolean valid,

        @Schema(description = "验证结果说明", example = "文件类型有效")
        String reason,

        @Schema(description = "允许的文件类型", example = "[\"pdf\", \"doc\", \"docx\", \"jpg\", \"jpeg\", \"png\"]")
        List<String> allowedTypes,

        @Schema(description = "最大文件大小", example = "10MB")
        String maxSize
) {}

