package com.duanruo.exam.application.dto.file;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(name = "ScanStatusResponse")
public record ScanStatusResponse(
        UUID fileId,
        String status,
        String result,
        LocalDateTime scannedAt
) {}

