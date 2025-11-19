package com.duanruo.exam.application.dto;

import java.util.Map;

/**
 * 报名统计DTO
 */
public record ApplicationStatisticsDTO(
        // 总体统计
        long totalApplications,
        long pendingReview,
        long approved,
        long rejected,
        long paid,
        long unpaid,
        
        // 按岗位统计
        Map<String, Long> applicationsByPosition,
        
        // 按状态统计
        Map<String, Long> applicationsByStatus,
        
        // 按日期统计（最近7天）
        Map<String, Long> applicationsByDate,
        
        // 转化率
        double approvalRate,
        double paymentRate
) {
}

