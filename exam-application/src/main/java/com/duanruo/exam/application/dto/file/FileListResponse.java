package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(name = "FileListResponse", description = "文件列表响应")
public record FileListResponse(
        @Schema(description = "文件信息列表")
        List<FileInfoResponse> files,
        
        @Schema(description = "总元素数", example = "25")
        long totalElements,
        
        @Schema(description = "总页数", example = "3")
        int totalPages,
        
        @Schema(description = "当前页码", example = "0")
        int currentPage,
        
        @Schema(description = "页大小", example = "20")
        int pageSize,
        
        @Schema(description = "是否有下一页", example = "true")
        boolean hasNext,
        
        @Schema(description = "是否有上一页", example = "false")
        boolean hasPrevious
) {}
