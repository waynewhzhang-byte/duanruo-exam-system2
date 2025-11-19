package com.duanruo.exam.domain.application;

/**
 * 报名申请状态枚举
 * 基于PRD中定义的状态机
 */
public enum ApplicationStatus {
    
    /**
     * 草稿状态
     */
    DRAFT("Draft"),
    
    /**
     * 已提交，等待自动审核
     */
    SUBMITTED("Submitted"),
    
    /**
     * 自动审核拒绝
     */
    AUTO_REJECTED("AutoRejected"),
    
    /**
     * 自动审核通过
     */
    AUTO_PASSED("AutoPassed"),
    
    /**
     * 等待一级人工审核
     */
    PENDING_PRIMARY_REVIEW("PendingPrimaryReview"),

    /**
     * 退回待重提（允许候选人更新并重新提交）
     */
    RETURNED_FOR_RESUBMISSION("ReturnedForResubmission"),

    /**
     * 已重提（等待进入人工初审流程）
     */
    RESUBMITTED("Resubmitted"),

    /**
     * 一级审核拒绝
     */
    PRIMARY_REJECTED("PrimaryRejected"),

    /**
     * 一级审核通过
     */
    PRIMARY_PASSED("PrimaryPassed"),

    /**
     * 等待复核
     */
    PENDING_SECONDARY_REVIEW("PendingSecondaryReview"),

    /**
     * 复核拒绝
     */
    SECONDARY_REJECTED("SecondaryRejected"),

    /**
     * 审核最终通过
     */
    APPROVED("Approved"),
    
    /**
     * 已缴费
     */
    PAID("Paid"),
    
    /**
     * 准考证已发放
     */
    TICKET_ISSUED("TicketIssued"),

    /**
     * 笔试已完成
     */
    WRITTEN_EXAM_COMPLETED("WrittenExamCompleted"),

    /**
     * 笔试不及格，无面试资格
     */
    WRITTEN_EXAM_FAILED("WrittenExamFailed"),

    /**
     * 笔试及格，有面试资格
     */
    INTERVIEW_ELIGIBLE("InterviewEligible"),

    /**
     * 面试已完成
     */
    INTERVIEW_COMPLETED("InterviewCompleted"),

    /**
     * 最终录取
     */
    FINAL_ACCEPTED("FinalAccepted"),

    /**
     * 最终未录取
     */
    FINAL_REJECTED("FinalRejected"),

    /**
     * 候选人撤销
     */
    WITHDRAWN("Withdrawn"),

    /**
     * 已过期
     */
    EXPIRED("Expired");
    
    private final String value;
    
    ApplicationStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    /**
     * 检查是否可以转换到目标状态
     */
    public boolean canTransitionTo(ApplicationStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED || target == WITHDRAWN;
            case SUBMITTED -> target == AUTO_REJECTED || target == AUTO_PASSED || target == PENDING_PRIMARY_REVIEW;
            case AUTO_PASSED -> target == APPROVED || target == PAID;
            case PENDING_PRIMARY_REVIEW -> target == PRIMARY_REJECTED || target == PRIMARY_PASSED || target == RETURNED_FOR_RESUBMISSION;
            case PRIMARY_PASSED -> target == PENDING_SECONDARY_REVIEW || target == APPROVED;
            case PENDING_SECONDARY_REVIEW -> target == SECONDARY_REJECTED || target == APPROVED || target == RETURNED_FOR_RESUBMISSION;
            case RETURNED_FOR_RESUBMISSION -> target == RESUBMITTED || target == SUBMITTED;
            case RESUBMITTED -> target == PENDING_PRIMARY_REVIEW || target == SUBMITTED;
            case APPROVED -> target == PAID || target == TICKET_ISSUED;
            case PAID -> target == TICKET_ISSUED;
            case TICKET_ISSUED -> target == WRITTEN_EXAM_COMPLETED;
            case WRITTEN_EXAM_COMPLETED -> target == WRITTEN_EXAM_FAILED || target == INTERVIEW_ELIGIBLE;
            case INTERVIEW_ELIGIBLE -> target == INTERVIEW_COMPLETED;
            case INTERVIEW_COMPLETED -> target == FINAL_ACCEPTED || target == FINAL_REJECTED;
            default -> false;
        };
    }
    
    /**
     * 是否为终态
     */
    public boolean isTerminal() {
        return this == AUTO_REJECTED || this == PRIMARY_REJECTED || this == SECONDARY_REJECTED
               || this == WRITTEN_EXAM_FAILED || this == FINAL_ACCEPTED || this == FINAL_REJECTED
               || this == WITHDRAWN || this == EXPIRED;
    }
    
    /**
     * 是否为审核中状态
     */
    public boolean isUnderReview() {
        return this == PENDING_PRIMARY_REVIEW || this == PENDING_SECONDARY_REVIEW;
    }
}
