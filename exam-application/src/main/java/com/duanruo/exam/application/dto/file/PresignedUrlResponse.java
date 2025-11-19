package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(name = "PresignedUrlResponse")
public record PresignedUrlResponse(
        UUID fileId,
        String url,
        int expiresIn,
        String fileName,
        String contentType,
        Long fileSize
) {}

