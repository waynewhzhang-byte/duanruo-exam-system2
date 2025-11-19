package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(name = "ApplicationResponse", description = "报名申请响应体")
public record ApplicationResponse(
        UUID id,
        UUID examId,
        UUID positionId,
        UUID candidateId,
        Integer formVersion,
        String status,
        LocalDateTime submittedAt
) {}

