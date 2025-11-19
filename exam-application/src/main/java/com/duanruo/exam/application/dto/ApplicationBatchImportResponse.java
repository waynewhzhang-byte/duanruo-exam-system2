package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 批量导入报名响应
 */
@Schema(name = "ApplicationBatchImportResponse", description = "批量导入报名响应")
public class ApplicationBatchImportResponse {

    @Schema(description = "总数")
    private Integer total;

    @Schema(description = "成功数")
    private Integer success;

    @Schema(description = "失败数")
    private Integer failed;

    @Schema(description = "成功的报名ID列表")
    private List<UUID> successIds = new ArrayList<>();

    @Schema(description = "失败的详细信息")
    private List<FailureDetail> failures = new ArrayList<>();

    public ApplicationBatchImportResponse() {
    }

    public ApplicationBatchImportResponse(Integer total, Integer success, Integer failed) {
        this.total = total;
        this.success = success;
        this.failed = failed;
    }

    // Getters and Setters
    public Integer getTotal() {
        return total;
    }

    public void setTotal(Integer total) {
        this.total = total;
    }

    public Integer getSuccess() {
        return success;
    }

    public void setSuccess(Integer success) {
        this.success = success;
    }

    public Integer getFailed() {
        return failed;
    }

    public void setFailed(Integer failed) {
        this.failed = failed;
    }

    public List<UUID> getSuccessIds() {
        return successIds;
    }

    public void setSuccessIds(List<UUID> successIds) {
        this.successIds = successIds;
    }

    public List<FailureDetail> getFailures() {
        return failures;
    }

    public void setFailures(List<FailureDetail> failures) {
        this.failures = failures;
    }

    /**
     * 失败详情
     */
    @Schema(name = "FailureDetail", description = "导入失败详情")
    public static class FailureDetail {

        @Schema(description = "行号（从1开始）")
        private Integer rowNumber;

        @Schema(description = "考生用户名")
        private String candidateUsername;

        @Schema(description = "错误原因")
        private String errorMessage;

        public FailureDetail() {
        }

        public FailureDetail(Integer rowNumber, String candidateUsername, String errorMessage) {
            this.rowNumber = rowNumber;
            this.candidateUsername = candidateUsername;
            this.errorMessage = errorMessage;
        }

        public Integer getRowNumber() {
            return rowNumber;
        }

        public void setRowNumber(Integer rowNumber) {
            this.rowNumber = rowNumber;
        }

        public String getCandidateUsername() {
            return candidateUsername;
        }

        public void setCandidateUsername(String candidateUsername) {
            this.candidateUsername = candidateUsername;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }
    }
}

