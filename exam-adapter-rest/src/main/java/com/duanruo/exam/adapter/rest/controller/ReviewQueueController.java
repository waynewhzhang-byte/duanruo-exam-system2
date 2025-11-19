package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.ReviewQueueApplicationService;
import com.duanruo.exam.domain.review.ReviewStage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.duanruo.exam.application.service.UserDirectoryApplicationService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/reviews")
@Tag(name = "审核队列", description = "初审/复审队列拉取、心跳、释放与决策（附证据）")
public class ReviewQueueController {

    private final ReviewQueueApplicationService service;
    private final UserDirectoryApplicationService userDirectoryService;

    public ReviewQueueController(ReviewQueueApplicationService service,
                                 UserDirectoryApplicationService userDirectoryService) {
        this.service = service;
        this.userDirectoryService = userDirectoryService;
    }

    public static record PullRequest(UUID examId, ReviewStage stage, UUID positionId) {}

    @Operation(summary = "拉取队列下一条")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/queue/pull")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String,Object>> pull(@RequestBody PullRequest req, Authentication auth, @CurrentUserId UUID reviewerId) {
        ensureStagePermission(req.stage(), auth);
        var r = service.pullNext(req.examId(), req.stage(), reviewerId, req.positionId());
        if (r.isEmpty()) return ResponseEntity.ok(Map.of("empty", true));
        return ResponseEntity.ok(Map.of(
                "taskId", r.taskId().toString(),
                "applicationId", r.applicationId().toString(),
                "stage", r.stage().name(),
                "lockedUntil", r.lockedUntil().toString()
        ));
    }

    @Operation(summary = "任务心跳")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/tasks/{taskId}/heartbeat")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String,Object>> heartbeat(@PathVariable("taskId") UUID taskId, @CurrentUserId UUID reviewerId) {
        service.heartbeat(taskId, reviewerId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @Operation(summary = "释放任务")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/tasks/{taskId}/release")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String,Object>> release(@PathVariable("taskId") UUID taskId, @CurrentUserId UUID reviewerId) {
        service.release(taskId, reviewerId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @Schema(name = "ReviewDecisionRequest")
    public static record ReviewDecisionRequest(String action, Boolean approve, String reason, List<UUID> evidenceFileIds) {}

    @Operation(summary = "提交审结（附证据）")
    @ApiResponse(responseCode = "200", description = "OK", content = @Content)
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/tasks/{taskId}/decision")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String,Object>> decision(@PathVariable("taskId") UUID taskId,
                                                       @RequestBody ReviewDecisionRequest body,
                                                       @CurrentUserId UUID reviewerId) {
        String action = body.action();
        Boolean approve = body.approve();
        var r = service.decide(taskId, reviewerId, action, approve, body.reason(), body.evidenceFileIds());
        return ResponseEntity.ok(Map.of(
                "applicationId", r.applicationId().toString(),
                "from", r.from().name(),
                "to", r.to().name(),
                "message", "审结完成"
        ));
    }

    @Operation(summary = "查询任务占用人信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/tasks/{taskId}/assignee")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String,Object>> assignee(@PathVariable("taskId") UUID taskId) {
        var info = service.getAssigneeInfo(taskId);
        String assignedTo = info.assignedTo() == null ? "" : info.assignedTo().toString();
        String assignedToName = info.assignedTo() == null ? "" : userDirectoryService.resolveDisplayName(info.assignedTo());
        return ResponseEntity.ok(Map.of(
                "taskId", info.taskId().toString(),
                "stage", info.stage().name(),
                "status", info.status().name(),
                "assignedTo", assignedTo,
                "assignedToName", assignedToName,
                "lockedAt", info.lockedAt() == null ? "" : info.lockedAt().toString(),
                "lastHeartbeatAt", info.lastHeartbeatAt() == null ? "" : info.lastHeartbeatAt().toString()
        ));
    }


    @Operation(summary = "查询队列（分页/过滤）")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/queue")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String,Object>> listQueue(
            @RequestParam("examId") UUID examId,
            @RequestParam("stage") ReviewStage stage,
            @RequestParam(value = "positionId", required = false) UUID positionId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            Authentication auth) {
        ensureStagePermission(stage, auth);
        var pageDto = service.listQueue(examId, stage, positionId, status, page, size);
        var content = pageDto.content().stream().map(e -> Map.of(
                "applicationId", e.applicationId().toString(),
                "stage", e.stage().name(),
                "status", e.status(),
                "taskId", e.taskId() == null ? "" : e.taskId().toString(),
                "assignedTo", e.assignedTo() == null ? "" : e.assignedTo().toString(),
                "lockedAt", e.lockedAt() == null ? "" : e.lockedAt().toString(),
                "lastHeartbeatAt", e.lastHeartbeatAt() == null ? "" : e.lastHeartbeatAt().toString(),
                "submittedAt", e.submittedAt() == null ? "" : e.submittedAt().toString()
        )).toList();
        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalElements", pageDto.totalElements(),
                "page", pageDto.page(),
                "size", pageDto.size()
        ));
    }

    @Operation(summary = "自动分配任务（负载均衡）")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/queue/auto-assign")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String,Object>> autoAssign(
            @RequestParam("examId") UUID examId,
            @RequestParam("stage") ReviewStage stage,
            @RequestParam(value = "batchSize", defaultValue = "50") int batchSize) {
        var result = service.autoAssign(examId, stage, batchSize);
        return ResponseEntity.ok(Map.of(
                "totalAssigned", result.totalAssigned(),
                "reviewerCount", result.reviewerCount(),
                "assignedPerReviewer", result.assignedPerReviewer()
        ));
    }

    @Schema(name = "BatchDecisionRequest")
    public static record BatchDecisionRequest(List<UUID> taskIds, boolean approve, String reason) {}

    @Operation(summary = "批量审核")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/tasks/batch-decision")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String,Object>> batchDecision(
            @RequestBody BatchDecisionRequest body,
            @CurrentUserId UUID reviewerId) {
        var result = service.batchDecide(body.taskIds(), reviewerId, body.approve(), body.reason());
        return ResponseEntity.ok(Map.of(
                "successCount", result.successCount(),
                "failureCount", result.failureCount(),
                "errors", result.errors()
        ));
    }

    @Operation(summary = "获取审核员工作台")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/workbench")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<Map<String,Object>> getWorkbench(
            @RequestParam("stage") ReviewStage stage,
            @CurrentUserId UUID reviewerId,
            Authentication auth) {
        ensureStagePermission(stage, auth);
        var data = service.getWorkbench(reviewerId, stage);

        var tasks = data.tasks().stream().map(t -> Map.of(
                "taskId", t.taskId().toString(),
                "applicationId", t.applicationId().toString(),
                "stage", t.stage().name(),
                "status", t.status().name(),
                "lockedAt", t.lockedAt() == null ? "" : t.lockedAt().toString(),
                "lastHeartbeatAt", t.lastHeartbeatAt() == null ? "" : t.lastHeartbeatAt().toString()
        )).toList();

        return ResponseEntity.ok(Map.of(
                "myPending", data.myPending(),
                "todayDone", data.todayDone(),
                "weekDone", data.weekDone(),
                "tasks", tasks
        ));
    }

    private void ensureStagePermission(ReviewStage stage, Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return; // fallback to @PreAuthorize
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("EXAM_ADMIN_MANAGE"));
        if (isAdmin) return;
        boolean ok = switch (stage) {
            case PRIMARY -> auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("REVIEW_PRIMARY"));
            case SECONDARY -> auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("REVIEW_SECONDARY"));
        };
        if (!ok) {
            throw new org.springframework.security.access.AccessDeniedException("Stage not permitted for current role");
        }
    }
}

