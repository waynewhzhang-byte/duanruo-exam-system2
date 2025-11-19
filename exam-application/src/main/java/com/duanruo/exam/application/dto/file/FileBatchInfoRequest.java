package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(name = "FileBatchInfoRequest", description = "批量获取文件信息请求")
public record FileBatchInfoRequest(
        @Schema(description = "文件ID列表", example = "[\"123e4567-e89b-12d3-a456-426614174000\", \"987fcdeb-51a2-43d1-b567-123456789abc\"]")
        @NotEmpty
        @Size(max = 100, message = "单次最多查询100个文件")
        List<String> fileIds
) {}
