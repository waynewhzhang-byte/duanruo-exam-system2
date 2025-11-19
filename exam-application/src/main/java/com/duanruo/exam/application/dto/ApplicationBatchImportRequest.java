package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 批量导入报名请求
 */
@Schema(name = "ApplicationBatchImportRequest", description = "批量导入报名请求")
public class ApplicationBatchImportRequest {

    @NotNull(message = "考试ID不能为空")
    @Schema(description = "考试ID", requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID examId;

    @NotEmpty(message = "导入数据不能为空")
    @Schema(description = "导入的报名数据列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ImportItem> items;

    @Schema(description = "是否跳过错误继续导入", defaultValue = "false")
    private Boolean skipErrors = false;

    public ApplicationBatchImportRequest() {
    }

    // Getters and Setters
    public UUID getExamId() {
        return examId;
    }

    public void setExamId(UUID examId) {
        this.examId = examId;
    }

    public List<ImportItem> getItems() {
        return items;
    }

    public void setItems(List<ImportItem> items) {
        this.items = items;
    }

    public Boolean getSkipErrors() {
        return skipErrors;
    }

    public void setSkipErrors(Boolean skipErrors) {
        this.skipErrors = skipErrors;
    }

    /**
     * 导入项
     */
    @Schema(name = "ImportItem", description = "单个导入项")
    public static class ImportItem {

        @NotNull(message = "岗位ID不能为空")
        @Schema(description = "岗位ID", requiredMode = Schema.RequiredMode.REQUIRED)
        private UUID positionId;

        @NotNull(message = "考生用户名不能为空")
        @Schema(description = "考生用户名", requiredMode = Schema.RequiredMode.REQUIRED)
        private String candidateUsername;

        @Schema(description = "表单数据")
        private Map<String, Object> payload;

        public ImportItem() {
        }

        public UUID getPositionId() {
            return positionId;
        }

        public void setPositionId(UUID positionId) {
            this.positionId = positionId;
        }

        public String getCandidateUsername() {
            return candidateUsername;
        }

        public void setCandidateUsername(String candidateUsername) {
            this.candidateUsername = candidateUsername;
        }

        public Map<String, Object> getPayload() {
            return payload;
        }

        public void setPayload(Map<String, Object> payload) {
            this.payload = payload;
        }
    }
}

