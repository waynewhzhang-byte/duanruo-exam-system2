package com.duanruo.exam.application.dto;

import java.util.Map;

/**
 * 考试统计DTO
 */
public record ExamStatisticsDTO(
        // 考试基本信息
        String examId,
        String examTitle,
        
        // 报名统计
        long totalApplications,
        long approvedApplications,
        long rejectedApplications,
        long paidApplications,
        
        // 岗位统计
        int totalPositions,
        Map<String, PositionStatistics> positionStatistics,
        
        // 审核统计
        long pendingFirstReview,
        long pendingSecondReview,
        long autoApproved,
        long autoRejected,
        
        // 支付统计
        double totalRevenue,
        double averagePaymentAmount,
        
        // 座位分配统计
        long assignedSeats,
        long unassignedSeats,
        
        // 准考证统计
        long ticketsIssued,
        long ticketsNotIssued
) {
    public record PositionStatistics(
            String positionId,
            String positionTitle,
            long applications,
            long approved,
            long rejected,
            long paid,
            int maxApplicants,
            double fillRate
    ) {}
}

