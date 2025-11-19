package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.ApplicationStatisticsDTO;
import com.duanruo.exam.application.dto.ExamStatisticsDTO;
import com.duanruo.exam.application.dto.PlatformStatisticsDTO;
import com.duanruo.exam.application.dto.TenantStatisticsDTO;
import com.duanruo.exam.application.service.StatisticsApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 数据分析统计控制器
 * 支持超级管理员和租户管理员两个层面的统计
 */
@RestController
@RequestMapping("/statistics")
@Tag(name = "数据分析统计", description = "报名统计、考试统计、租户统计、平台统计等数据分析功能")
public class StatisticsController {

    private final StatisticsApplicationService statisticsService;

    public StatisticsController(StatisticsApplicationService statisticsService) {
        this.statisticsService = statisticsService;
    }

    // ==================== 租户管理员级别的统计 ====================

    @Operation(
            summary = "获取报名统计",
            description = "获取指定考试的报名统计数据（租户管理员可见）"
    )
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/applications/{examId}")
    @PreAuthorize("hasAuthority('STATISTICS_VIEW')")
    public ResponseEntity<ApplicationStatisticsDTO> getApplicationStatistics(
            @Parameter(description = "考试ID")
            @PathVariable("examId") UUID examId) {
        
        ApplicationStatisticsDTO statistics = statisticsService.getApplicationStatistics(examId);
        return ResponseEntity.ok(statistics);
    }

    @Operation(
            summary = "获取考试统计",
            description = "获取指定考试的详细统计数据（租户管理员可见）"
    )
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/exams/{examId}")
    @PreAuthorize("hasAuthority('STATISTICS_VIEW')")
    public ResponseEntity<ExamStatisticsDTO> getExamStatistics(
            @Parameter(description = "考试ID")
            @PathVariable("examId") UUID examId) {
        
        ExamStatisticsDTO statistics = statisticsService.getExamStatistics(examId);
        return ResponseEntity.ok(statistics);
    }

    // ==================== 超级管理员级别的统计 ====================

    @Operation(
            summary = "获取租户统计",
            description = "获取指定租户的统计数据（仅超级管理员可见）"
    )
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/tenants/{tenantId}")
    @PreAuthorize("hasAuthority('STATISTICS_TENANT_VIEW')")
    public ResponseEntity<TenantStatisticsDTO> getTenantStatistics(
            @Parameter(description = "租户ID")
            @PathVariable("tenantId") String tenantId) {
        
        TenantStatisticsDTO statistics = statisticsService.getTenantStatistics(tenantId);
        return ResponseEntity.ok(statistics);
    }

    @Operation(
            summary = "获取平台统计",
            description = "获取整个平台的统计数据（仅超级管理员可见）"
    )
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/platform")
    @PreAuthorize("hasAuthority('STATISTICS_SYSTEM_VIEW')")
    public ResponseEntity<PlatformStatisticsDTO> getPlatformStatistics() {
        PlatformStatisticsDTO statistics = statisticsService.getPlatformStatistics();
        return ResponseEntity.ok(statistics);
    }
}

