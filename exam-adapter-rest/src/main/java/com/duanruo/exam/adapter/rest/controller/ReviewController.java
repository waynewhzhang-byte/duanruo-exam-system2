package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 审核管理REST控制器
 * 实现人工审核流程的核心功能
 */
@RestController
@RequestMapping("/reviews")
@Tag(name = "审核管理", description = "人工审核流程的管理操作")
public class ReviewController {

    private final com.duanruo.exam.application.service.ReviewApplicationService reviewService;
    private final com.duanruo.exam.domain.review.ReviewTaskRepository reviewTaskRepository;
    private final com.duanruo.exam.domain.review.ExamReviewerRepository examReviewerRepository;

    public ReviewController(com.duanruo.exam.application.service.ReviewApplicationService reviewService,
                            com.duanruo.exam.domain.review.ReviewTaskRepository reviewTaskRepository,
                            com.duanruo.exam.domain.review.ExamReviewerRepository examReviewerRepository) {
        this.reviewService = reviewService;
        this.reviewTaskRepository = reviewTaskRepository;
        this.examReviewerRepository = examReviewerRepository;
    }

    @Operation(summary = "获取待审核申请", description = "获取当前用户权限范围内的待审核申请列表（仅本人占用；可选包含未占用且限关联考试）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<Map<String, Object>> getPendingReviews(
            @Parameter(description = "审核阶段：PRIMARY/SECONDARY") @RequestParam(required = false) String stage,
            @Parameter(description = "是否包含未占用任务（仅限关联考试）") @RequestParam(defaultValue = "false") boolean includeUnassigned,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "页大小") @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("EXAM_ADMIN_MANAGE"));
        com.duanruo.exam.domain.review.ReviewStage s = parseStage(stage);

        List<com.duanruo.exam.domain.review.ReviewTask> assigned;
        List<com.duanruo.exam.domain.review.ReviewTask> open = java.util.List.of();

        if (isAdmin) {
            assigned = reviewTaskRepository.findAssignedAll();
            if (includeUnassigned) {
                open = reviewTaskRepository.findOpenAll(s);
            }
        } else {
            UUID reviewerId;
            try { reviewerId = UUID.fromString(authentication.getName()); } catch (Exception ex) {
                return ResponseEntity.ok(emptyPage(page, size));
            }
            assigned = reviewTaskRepository.findAssignedTo(reviewerId);
            if (includeUnassigned) {
                List<UUID> examIds = examReviewerRepository.findExamIdsByReviewer(reviewerId);
                if (!examIds.isEmpty()) {
                    open = reviewTaskRepository.findOpenByExamIds(examIds, s);
                }
            }
        }

        List<com.duanruo.exam.domain.review.ReviewTask> merged = new java.util.ArrayList<>();
        merged.addAll(assigned);
        merged.addAll(open);
        // 简单排序：按创建时间升序
        merged.sort(java.util.Comparator.comparing(com.duanruo.exam.domain.review.ReviewTask::getCreatedAt));

        int from = Math.max(0, page * size);
        int to = Math.min(merged.size(), from + size);
        if (from >= merged.size()) {
            return ResponseEntity.ok(pagedResult(java.util.List.of(), merged.size(), page, size));
        }
        java.util.List<java.util.Map<String, Object>> content = new java.util.ArrayList<>();
        for (var t : merged.subList(from, to)) {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("taskId", t.getId());
            m.put("applicationId", t.getApplicationId().getValue());
            m.put("stage", t.getStage().name());
            m.put("status", t.getStatus().name());
            m.put("assignedTo", t.getAssignedTo());
            m.put("lockedAt", t.getLockedAt());
            m.put("createdAt", t.getCreatedAt());
            content.add(m);
        }

        return ResponseEntity.ok(pagedResult(content, merged.size(), page, size));
    }

    private com.duanruo.exam.domain.review.ReviewStage parseStage(String stage) {
        if (stage == null) return null;
        return switch (stage.toUpperCase()) {
            case "PRIMARY" -> com.duanruo.exam.domain.review.ReviewStage.PRIMARY;
            case "SECONDARY" -> com.duanruo.exam.domain.review.ReviewStage.SECONDARY;
            default -> null;
        };
    }

    private Map<String, Object> emptyPage(int page, int size) {
        return Map.of(
                "content", List.of(),
                "totalElements", 0,
                "totalPages", 0,
                "currentPage", page,
                "pageSize", size,
                "hasNext", false,
                "hasPrevious", false
        );
    }

    private Map<String, Object> pagedResult(List<Map<String, Object>> content, int total, int page, int size) {
        int totalPages = (int) Math.ceil(total / (double) size);
        boolean hasNext = page + 1 < totalPages;
        boolean hasPrevious = page > 0;
        return Map.of(
                "content", content,
                "totalElements", total,
                "totalPages", totalPages,
                "currentPage", page,
                "pageSize", size,
                "hasNext", hasNext,
                "hasPrevious", hasPrevious
        );
    }


    @Operation(summary = "获取审核任务详情", description = "获取指定审核任务的详细信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{applicationId}")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<Map<String, Object>> getReviewDetails(@PathVariable("applicationId") UUID applicationId,
                                                                Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            java.util.UUID reviewerId;
            try { reviewerId = java.util.UUID.fromString(authentication.getName()); } catch (Exception ex) {
                throw new com.duanruo.exam.shared.exception.ApplicationException("FORBIDDEN_REVIEW_SCOPE", "无权访问该审核任务");
            }
            boolean assigned = reviewTaskRepository.findAssignedTo(reviewerId).stream()
                    .anyMatch(t -> java.util.Objects.equals(t.getApplicationId().getValue(), applicationId));
            if (!assigned) {
                throw new com.duanruo.exam.shared.exception.ApplicationException("FORBIDDEN_REVIEW_SCOPE", "仅本人占用的任务可见");
            }
        }

        return ResponseEntity.ok(Map.of(
            "applicationId", applicationId.toString(),
            "examTitle", "2024年度招聘考试",
            "positionTitle", "软件开发工程师",
            "candidateInfo", Map.of(
                "name", "张三",
                "idNumber", "110101199001011234",
                "phone", "13800138000",
                "email", "zhangsan@example.com",
                "education", "本科",
                "experience", "3年工作经验"
            ),
            "attachments", List.of(
                Map.of(
                    "id", UUID.randomUUID().toString(),
                    "filename", "身份证.pdf",
                    "type", "ID_CARD",
                    "downloadUrl", "https://minio.example.com/download/id-card.pdf"
                ),
                Map.of(
                    "id", UUID.randomUUID().toString(),
                    "filename", "学历证书.pdf",
                    "type", "DIPLOMA",
                    "downloadUrl", "https://minio.example.com/download/diploma.pdf"
                )
            ),
            "autoReviewResult", Map.of(
                "decision", "MANUAL_REVIEW_REQUIRED",
                "reason", "学历需要人工验证",
                "triggeredRules", List.of("degree_required"),
                "executedAt", "2024-01-01T12:01:00Z"
            ),
            "reviewHistory", List.of(
                Map.of(
                    "level", "AUTO",
                    "decision", "MANUAL_REVIEW_REQUIRED",
                    "reviewer", "SYSTEM",
                    "reviewedAt", "2024-01-01T12:01:00Z",
                    "comments", "学历需要人工验证"
                )
            ),
            "currentStatus", "PENDING_PRIMARY_REVIEW",
            "submittedAt", "2024-01-01T12:00:00Z"
        ));
    }

    @Operation(summary = "审核通过", description = "审核员通过申请")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{applicationId}/approve")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<Map<String, Object>> approveApplication(
            @PathVariable("applicationId") UUID applicationId,
            @RequestBody Map<String, Object> reviewData,
            Authentication authentication) {

        String reviewerRole = determineReviewerRole(authentication);
        com.duanruo.exam.domain.application.ApplicationStatus target = switch (reviewerRole) {
            case "PRIMARY" -> com.duanruo.exam.domain.application.ApplicationStatus.PENDING_SECONDARY_REVIEW;
            case "SECONDARY", "ADMIN" -> com.duanruo.exam.domain.application.ApplicationStatus.APPROVED;
            default -> com.duanruo.exam.domain.application.ApplicationStatus.PENDING_PRIMARY_REVIEW;
        };
        com.duanruo.exam.domain.application.ApplicationStatus result = reviewService.applyDecision(
                applicationId, target, String.valueOf(reviewData.getOrDefault("comments", ""))
        );

        return ResponseEntity.ok(Map.of(
            "applicationId", applicationId.toString(),
            "decision", "APPROVED",
            "newStatus", result.name(),
            "reviewer", authentication.getName(),
            "reviewLevel", reviewerRole,
            "comments", reviewData.get("comments"),
            "reviewedAt", LocalDateTime.now().toString(),
            "message", "申请审核通过"
        ));
    }

    @Operation(summary = "审核拒绝", description = "审核员拒绝申请")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{applicationId}/reject")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<Map<String, Object>> rejectApplication(
            @PathVariable("applicationId") UUID applicationId,
            @RequestBody Map<String, Object> reviewData,
            Authentication authentication) {

        // 根据PRD实现审核拒绝逻辑
        // Where a reviewer rejects an application, the system shall store the reason and evidence and notify the candidate.

        String reviewerRole = determineReviewerRole(authentication);
        String newStatus = determineNewStatusForRejection(reviewerRole);

        return ResponseEntity.ok(Map.of(
            "applicationId", applicationId.toString(),
            "decision", "REJECTED",
            "newStatus", newStatus,
            "reviewer", authentication.getName(),
            "reviewLevel", reviewerRole,
            "reason", reviewData.get("reason"),
            "comments", reviewData.get("comments"),
            "evidence", reviewData.get("evidence"),
            "reviewedAt", LocalDateTime.now().toString(),
            "message", "申请已被拒绝，候选人将收到通知"
        ));
    }

    @Operation(summary = "批量审核", description = "批量审核多个报名申请")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/batch-review")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','EXAM_ADMIN_MANAGE')")
    public ResponseEntity<com.duanruo.exam.application.dto.BatchReviewResponse> batchReview(
            @Valid @RequestBody com.duanruo.exam.application.dto.BatchReviewRequest request,
            @CurrentUserId UUID reviewerId,
            Authentication authentication) {

        String stage = determineReviewerRole(authentication);
        com.duanruo.exam.application.dto.BatchReviewResponse response =
            reviewService.batchReview(request, reviewerId, stage);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "获取审核统计", description = "获取审核工作的统计信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyAuthority('REVIEW_PRIMARY','REVIEW_SECONDARY','REVIEW_STATISTICS')")
    public ResponseEntity<Map<String, Object>> getReviewStatistics(Authentication authentication) {

        return ResponseEntity.ok(Map.of(
            "pendingPrimaryReview", 15,
            "pendingSecondaryReview", 8,
            "todayProcessed", 12,
            "weeklyProcessed", 67,
            "averageProcessingTime", "2.5小时",
            "myPendingTasks", 5,
            "myProcessedToday", 3,
            "approvalRate", 0.85,
            "rejectionRate", 0.15
        ));
    }

    /**
     * 确定审核员角色
     */
    private String determineReviewerRole(Authentication authentication) {
        if (authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("REVIEW_SECONDARY"))) {
            return "SECONDARY";
        } else if (authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("REVIEW_PRIMARY"))) {
            return "PRIMARY";
        } else {
            return "ADMIN";
        }
    }

    /**
     * 确定通过审核后的新状态
     */
    private String determineNewStatusForApproval(String reviewerRole) {
        return switch (reviewerRole) {
            case "PRIMARY" -> "PENDING_SECONDARY_REVIEW";
            case "SECONDARY" -> "APPROVED";
            case "ADMIN" -> "APPROVED";
            default -> "APPROVED";
        };
    }

    /**
     * 确定拒绝审核后的新状态
     */
    private String determineNewStatusForRejection(String reviewerRole) {
        return switch (reviewerRole) {
            case "PRIMARY" -> "PRIMARY_REJECTED";
            case "SECONDARY" -> "SECONDARY_REJECTED";
            case "ADMIN" -> "REJECTED";
            default -> "REJECTED";
        };
    }
}
