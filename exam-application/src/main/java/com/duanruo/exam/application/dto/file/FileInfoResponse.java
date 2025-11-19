package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(name = "FileInfoResponse")
public record FileInfoResponse(
        UUID fileId,
        String fileName,
        String originalName,
        String contentType,
        Long fileSize,
        String status,
        String virusScanStatus,
        String fieldKey,
        UUID applicationId,
        String uploadedBy,
        LocalDateTime uploadedAt,
        LocalDateTime lastAccessedAt,
        Integer accessCount
) {}

