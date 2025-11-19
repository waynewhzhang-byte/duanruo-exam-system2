package com.duanruo.exam.application.dto;

import java.util.List;

/**
 * 租户统计DTO（仅超级管理员可见）
 */
public record TenantStatisticsDTO(
        // 租户基本信息
        String tenantId,
        String tenantName,
        
        // 考试统计
        long totalExams,
        long activeExams,
        long completedExams,
        
        // 报名统计
        long totalApplications,
        long approvedApplications,
        long rejectedApplications,
        long paidApplications,
        
        // 用户统计
        long totalUsers,
        long activeUsers,
        
        // 收入统计
        double totalRevenue,
        
        // 最近的考试
        List<RecentExam> recentExams
) {
    public record RecentExam(
            String examId,
            String examTitle,
            String startDate,
            long applications
    ) {}
}

