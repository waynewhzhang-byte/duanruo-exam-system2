package com.duanruo.exam.application.dto;

import java.util.List;
import java.util.Map;

/**
 * 平台统计DTO（仅超级管理员可见）
 */
public record PlatformStatisticsDTO(
        // 租户统计
        long totalTenants,
        long activeTenants,
        
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
        double averageRevenuePerTenant,
        
        // 按租户统计
        List<TenantRanking> topTenantsByApplications,
        List<TenantRanking> topTenantsByRevenue,
        
        // 趋势数据（最近30天）
        Map<String, Long> applicationTrend,
        Map<String, Double> revenueTrend
) {
    public record TenantRanking(
            String tenantId,
            String tenantName,
            long value,
            double percentage
    ) {}
}

