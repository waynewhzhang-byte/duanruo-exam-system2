package com.duanruo.exam.application.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 批量生成准考证响应DTO
 */
public class BatchGenerateTicketsResponse {
    
    private int totalCount;
    private int successCount;
    private int failureCount;
    private List<TicketResult> results = new ArrayList<>();
    
    public static class TicketResult {
        private UUID applicationId;
        private boolean success;
        private String ticketNo;
        private String errorMessage;
        
        public UUID getApplicationId() {
            return applicationId;
        }
        
        public void setApplicationId(UUID applicationId) {
            this.applicationId = applicationId;
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public String getTicketNo() {
            return ticketNo;
        }
        
        public void setTicketNo(String ticketNo) {
            this.ticketNo = ticketNo;
        }
        
        public String getErrorMessage() {
            return errorMessage;
        }
        
        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }
    }
    
    public int getTotalCount() {
        return totalCount;
    }
    
    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }
    
    public int getSuccessCount() {
        return successCount;
    }
    
    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }
    
    public int getFailureCount() {
        return failureCount;
    }
    
    public void setFailureCount(int failureCount) {
        this.failureCount = failureCount;
    }
    
    public List<TicketResult> getResults() {
        return results;
    }
    
    public void setResults(List<TicketResult> results) {
        this.results = results;
    }
}

