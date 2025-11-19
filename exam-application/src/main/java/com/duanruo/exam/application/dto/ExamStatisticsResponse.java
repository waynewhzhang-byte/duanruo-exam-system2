package com.duanruo.exam.application.dto;

import java.util.List;
import java.util.Map;

/**
 * 考试统计响应DTO
 */
public class ExamStatisticsResponse {

    private String examId;
    private String examCode;
    private String examTitle;
    
    // 报名统计
    private Long totalApplications;  // 总报名数
    private Long draftApplications;  // 草稿状态
    private Long submittedApplications;  // 已提交
    private Long pendingPrimaryReviewApplications;  // 待一级审核
    private Long primaryPassedApplications;  // 一级审核通过
    private Long primaryRejectedApplications;  // 一级审核拒绝
    private Long pendingSecondaryReviewApplications;  // 待二级审核
    private Long approvedApplications;  // 审核通过
    private Long secondaryRejectedApplications;  // 二级审核拒绝
    private Long paidApplications;  // 已支付
    private Long ticketIssuedApplications;  // 已发证
    
    // 审核统计
    private Double primaryApprovalRate;  // 一级审核通过率
    private Double secondaryApprovalRate;  // 二级审核通过率
    private Double overallApprovalRate;  // 总体通过率
    
    // 岗位统计
    private List<PositionStatistics> positionStatistics;
    
    // 时间统计
    private Map<String, Long> applicationsByDate;  // 按日期统计报名数
    
    public ExamStatisticsResponse() {
    }

    public ExamStatisticsResponse(String examId, String examCode, String examTitle) {
        this.examId = examId;
        this.examCode = examCode;
        this.examTitle = examTitle;
    }

    // Getters and Setters
    public String getExamId() {
        return examId;
    }

    public void setExamId(String examId) {
        this.examId = examId;
    }

    public String getExamCode() {
        return examCode;
    }

    public void setExamCode(String examCode) {
        this.examCode = examCode;
    }

    public String getExamTitle() {
        return examTitle;
    }

    public void setExamTitle(String examTitle) {
        this.examTitle = examTitle;
    }

    public Long getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(Long totalApplications) {
        this.totalApplications = totalApplications;
    }

    public Long getDraftApplications() {
        return draftApplications;
    }

    public void setDraftApplications(Long draftApplications) {
        this.draftApplications = draftApplications;
    }

    public Long getSubmittedApplications() {
        return submittedApplications;
    }

    public void setSubmittedApplications(Long submittedApplications) {
        this.submittedApplications = submittedApplications;
    }

    public Long getPendingPrimaryReviewApplications() {
        return pendingPrimaryReviewApplications;
    }

    public void setPendingPrimaryReviewApplications(Long pendingPrimaryReviewApplications) {
        this.pendingPrimaryReviewApplications = pendingPrimaryReviewApplications;
    }

    public Long getPrimaryPassedApplications() {
        return primaryPassedApplications;
    }

    public void setPrimaryPassedApplications(Long primaryPassedApplications) {
        this.primaryPassedApplications = primaryPassedApplications;
    }

    public Long getPrimaryRejectedApplications() {
        return primaryRejectedApplications;
    }

    public void setPrimaryRejectedApplications(Long primaryRejectedApplications) {
        this.primaryRejectedApplications = primaryRejectedApplications;
    }

    public Long getPendingSecondaryReviewApplications() {
        return pendingSecondaryReviewApplications;
    }

    public void setPendingSecondaryReviewApplications(Long pendingSecondaryReviewApplications) {
        this.pendingSecondaryReviewApplications = pendingSecondaryReviewApplications;
    }

    public Long getApprovedApplications() {
        return approvedApplications;
    }

    public void setApprovedApplications(Long approvedApplications) {
        this.approvedApplications = approvedApplications;
    }

    public Long getSecondaryRejectedApplications() {
        return secondaryRejectedApplications;
    }

    public void setSecondaryRejectedApplications(Long secondaryRejectedApplications) {
        this.secondaryRejectedApplications = secondaryRejectedApplications;
    }

    public Long getPaidApplications() {
        return paidApplications;
    }

    public void setPaidApplications(Long paidApplications) {
        this.paidApplications = paidApplications;
    }

    public Long getTicketIssuedApplications() {
        return ticketIssuedApplications;
    }

    public void setTicketIssuedApplications(Long ticketIssuedApplications) {
        this.ticketIssuedApplications = ticketIssuedApplications;
    }

    public Double getPrimaryApprovalRate() {
        return primaryApprovalRate;
    }

    public void setPrimaryApprovalRate(Double primaryApprovalRate) {
        this.primaryApprovalRate = primaryApprovalRate;
    }

    public Double getSecondaryApprovalRate() {
        return secondaryApprovalRate;
    }

    public void setSecondaryApprovalRate(Double secondaryApprovalRate) {
        this.secondaryApprovalRate = secondaryApprovalRate;
    }

    public Double getOverallApprovalRate() {
        return overallApprovalRate;
    }

    public void setOverallApprovalRate(Double overallApprovalRate) {
        this.overallApprovalRate = overallApprovalRate;
    }

    public List<PositionStatistics> getPositionStatistics() {
        return positionStatistics;
    }

    public void setPositionStatistics(List<PositionStatistics> positionStatistics) {
        this.positionStatistics = positionStatistics;
    }

    public Map<String, Long> getApplicationsByDate() {
        return applicationsByDate;
    }

    public void setApplicationsByDate(Map<String, Long> applicationsByDate) {
        this.applicationsByDate = applicationsByDate;
    }

    /**
     * 岗位统计内部类
     */
    public static class PositionStatistics {
        private String positionId;
        private String positionCode;
        private String positionName;
        private Integer quota;  // 招聘名额
        private Long applicationCount;  // 报名人数
        private Long approvedCount;  // 审核通过人数
        private Double competitionRatio;  // 竞争比例（报名人数/招聘名额）

        public PositionStatistics() {
        }

        public PositionStatistics(String positionId, String positionCode, String positionName, 
                                 Integer quota, Long applicationCount, Long approvedCount) {
            this.positionId = positionId;
            this.positionCode = positionCode;
            this.positionName = positionName;
            this.quota = quota;
            this.applicationCount = applicationCount;
            this.approvedCount = approvedCount;
            this.competitionRatio = quota != null && quota > 0 ? 
                (double) applicationCount / quota : 0.0;
        }

        // Getters and Setters
        public String getPositionId() {
            return positionId;
        }

        public void setPositionId(String positionId) {
            this.positionId = positionId;
        }

        public String getPositionCode() {
            return positionCode;
        }

        public void setPositionCode(String positionCode) {
            this.positionCode = positionCode;
        }

        public String getPositionName() {
            return positionName;
        }

        public void setPositionName(String positionName) {
            this.positionName = positionName;
        }

        public Integer getQuota() {
            return quota;
        }

        public void setQuota(Integer quota) {
            this.quota = quota;
        }

        public Long getApplicationCount() {
            return applicationCount;
        }

        public void setApplicationCount(Long applicationCount) {
            this.applicationCount = applicationCount;
        }

        public Long getApprovedCount() {
            return approvedCount;
        }

        public void setApprovedCount(Long approvedCount) {
            this.approvedCount = approvedCount;
        }

        public Double getCompetitionRatio() {
            return competitionRatio;
        }

        public void setCompetitionRatio(Double competitionRatio) {
            this.competitionRatio = competitionRatio;
        }
    }
}

