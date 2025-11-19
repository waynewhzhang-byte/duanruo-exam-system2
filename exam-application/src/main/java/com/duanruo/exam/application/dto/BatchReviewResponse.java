package com.duanruo.exam.application.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 批量审核响应
 */
public class BatchReviewResponse {
    
    private Integer total;
    private Integer success;
    private Integer failed;
    private List<UUID> successIds = new ArrayList<>();
    private List<FailureDetail> failures = new ArrayList<>();

    public BatchReviewResponse() {
    }

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
    public static class FailureDetail {
        private UUID applicationId;
        private String errorMessage;

        public FailureDetail() {
        }

        public FailureDetail(UUID applicationId, String errorMessage) {
            this.applicationId = applicationId;
            this.errorMessage = errorMessage;
        }

        public UUID getApplicationId() {
            return applicationId;
        }

        public void setApplicationId(UUID applicationId) {
            this.applicationId = applicationId;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }
    }
}

