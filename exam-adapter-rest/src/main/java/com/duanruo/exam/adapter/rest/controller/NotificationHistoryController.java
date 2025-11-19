package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import com.duanruo.exam.application.dto.NotificationHistoryDTO;
import com.duanruo.exam.application.dto.NotificationStatisticsDTO;
import com.duanruo.exam.application.service.NotificationHistoryApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 通知历史查询控制器
 */
@RestController
@RequestMapping("/notification-histories")
@Tag(name = "通知历史查询", description = "通知发送历史的查询和统计功能")
public class NotificationHistoryController {

    private final NotificationHistoryApplicationService historyService;

    public NotificationHistoryController(NotificationHistoryApplicationService historyService) {
        this.historyService = historyService;
    }

    @Operation(summary = "获取通知历史详情", description = "根据ID获取通知历史详情")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('NOTIFICATION_HISTORY_VIEW')")
    public ResponseEntity<NotificationHistoryDTO> getById(@PathVariable("id") UUID id) {
        NotificationHistoryDTO history = historyService.getById(id);
        return ResponseEntity.ok(history);
    }

    @Operation(summary = "获取当前用户的通知历史", description = "获取当前登录用户的所有通知历史")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getMyNotifications(@CurrentUserId UUID userId) {
        List<NotificationHistoryDTO> histories = historyService.listByUserId(userId);
        return ResponseEntity.ok(Map.of(
            "items", histories,
            "total", histories.size()
        ));
    }

    @Operation(summary = "查询通知历史", description = "根据条件查询通知历史（分页）")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping
    @PreAuthorize("hasAuthority('NOTIFICATION_HISTORY_LIST')")
    public ResponseEntity<Map<String, Object>> query(
            @Parameter(description = "接收人用户ID")
            @RequestParam(required = false) UUID recipientUserId,
            
            @Parameter(description = "通知渠道", example = "email")
            @RequestParam(required = false) String channel,
            
            @Parameter(description = "发送状态", example = "success")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "开始时间", example = "2024-01-01T00:00:00")
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            
            @Parameter(description = "结束时间", example = "2024-12-31T23:59:59")
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            
            @Parameter(description = "页码（从0开始）", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "每页大小", example = "20")
            @RequestParam(defaultValue = "20") int size) {
        
        Map<String, Object> result = historyService.queryByConditions(
            recipientUserId,
            channel,
            status,
            startTime,
            endTime,
            page,
            size
        );

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "获取通知统计信息", description = "获取通知发送的统计数据")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('NOTIFICATION_HISTORY_STATISTICS')")
    public ResponseEntity<NotificationStatisticsDTO> getStatistics() {
        NotificationStatisticsDTO statistics = historyService.getStatistics();
        return ResponseEntity.ok(statistics);
    }

    @Operation(summary = "重发通知", description = "重新发送失败的通知")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/{id}/resend")
    @PreAuthorize("hasAuthority('NOTIFICATION_HISTORY_RESEND')")
    public ResponseEntity<Map<String, String>> resend(@PathVariable("id") UUID id) {
        historyService.resendNotification(id);
        return ResponseEntity.ok(Map.of("message", "通知已重新发送"));
    }

    @Operation(summary = "删除通知历史", description = "删除指定的通知历史记录")
    @ApiResponse(responseCode = "204", description = "No Content")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('NOTIFICATION_HISTORY_DELETE')")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        historyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

