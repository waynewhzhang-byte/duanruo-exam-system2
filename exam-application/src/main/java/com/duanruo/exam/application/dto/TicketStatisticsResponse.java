package com.duanruo.exam.application.dto;

import java.util.UUID;

/**
 * 准考证统计响应DTO
 */
public class TicketStatisticsResponse {
    
    private UUID examId;
    private long totalCount;
    private long issuedCount;
    private long printedCount;
    private long verifiedCount;
    private long cancelledCount;
    
    public UUID getExamId() {
        return examId;
    }
    
    public void setExamId(UUID examId) {
        this.examId = examId;
    }
    
    public long getTotalCount() {
        return totalCount;
    }
    
    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }
    
    public long getIssuedCount() {
        return issuedCount;
    }
    
    public void setIssuedCount(long issuedCount) {
        this.issuedCount = issuedCount;
    }
    
    public long getPrintedCount() {
        return printedCount;
    }
    
    public void setPrintedCount(long printedCount) {
        this.printedCount = printedCount;
    }
    
    public long getVerifiedCount() {
        return verifiedCount;
    }
    
    public void setVerifiedCount(long verifiedCount) {
        this.verifiedCount = verifiedCount;
    }
    
    public long getCancelledCount() {
        return cancelledCount;
    }
    
    public void setCancelledCount(long cancelledCount) {
        this.cancelledCount = cancelledCount;
    }
}

