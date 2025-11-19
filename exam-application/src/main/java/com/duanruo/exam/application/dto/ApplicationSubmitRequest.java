package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Schema(name = "ApplicationSubmitRequest", description = "提交报名的请求体")
public record ApplicationSubmitRequest(
        @Schema(description = "考试ID", requiredMode = Schema.RequiredMode.REQUIRED)
        UUID examId,
        @Schema(description = "岗位ID", requiredMode = Schema.RequiredMode.REQUIRED)
        UUID positionId,
        @Schema(description = "表单版本", defaultValue = "1")
        Integer formVersion,
        @Schema(description = "表单JSON数据", requiredMode = Schema.RequiredMode.REQUIRED)
        Map<String, Object> payload,
        @Schema(description = "附件引用列表：{fileId, fieldKey}")
        List<AttachmentRef> attachments
) {
    @Schema(name = "AttachmentRef", description = "附件引用")
    public record AttachmentRef(
            UUID fileId,
            String fieldKey
    ) {}
}

