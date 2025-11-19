package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.constants.ApiConstants;
import com.duanruo.exam.adapter.rest.dto.ApplicationAttachmentUploadRequest;
import com.duanruo.exam.adapter.rest.dto.ApplicationBatchTransitionRequest;
import com.duanruo.exam.adapter.rest.dto.ApplicationPayRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 报名申请REST控制器
 * 实现考试报名的核心功能
 */
@RestController
@RequestMapping("/applications")
@Tag(name = "报名管理", description = "考试报名申请的提交、查询、撤销等操作")
public class ApplicationController {

    private final com.duanruo.exam.application.service.ApplicationApplicationService appService;
    private final com.duanruo.exam.application.service.ApplicationAuditLogApplicationService auditService;
    private final com.duanruo.exam.application.service.ReviewApplicationService reviewService;
    // TODO: Implement ApplicationExcelService for Excel import/export functionality
    // private final com.duanruo.exam.application.service.ApplicationExcelService excelService;

    public ApplicationController(com.duanruo.exam.application.service.ApplicationApplicationService appService,
                                 com.duanruo.exam.application.service.ApplicationAuditLogApplicationService auditService,
                                 com.duanruo.exam.application.service.ReviewApplicationService reviewService) {
        this.appService = appService;
        this.auditService = auditService;
        this.reviewService = reviewService;
        // this.excelService = excelService;
    }

    @Operation(summary = "提交报名申请", description = "候选人提交考试报名申请")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping
    @PreAuthorize("hasAuthority('APPLICATION_CREATE')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> submitApplication(
            @RequestBody com.duanruo.exam.application.dto.ApplicationSubmitRequest request,
            @CurrentUserId UUID candidateId) {
        var resp = appService.submit(candidateId, request);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "查看我的报名", description = "候选人查看自己的报名申请（支持分页与状态过滤）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('APPLICATION_VIEW_OWN')")
    public ResponseEntity<Map<String, Object>> getMyApplications(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "sort", required = false) String sort,
            @RequestParam(name = "examId", required = false) java.util.UUID examId,
            @RequestParam(name = "positionId", required = false) java.util.UUID positionId,
            @CurrentUserId UUID candidateId) {
        var all = appService.listMyEnriched(candidateId);
        // 过滤状态（忽略非法状态值）
        if (status != null && !status.isBlank()) {
            var st = status.trim().toUpperCase();
            all = all.stream().filter(a -> st.equals(a.status())).toList();
        }
        // 过滤考试/岗位
        if (examId != null) {
            java.util.UUID eid = examId;
            all = all.stream().filter(a -> eid.equals(a.examId())).toList();
        }
        if (positionId != null) {
            java.util.UUID pid = positionId;
            all = all.stream().filter(a -> pid.equals(a.positionId())).toList();
        }
        // 可选排序：目前仅支持 submittedAt,asc|desc
        if (sort != null && !sort.isBlank()) {
            String s = sort.trim().toLowerCase();
            boolean bySubmittedAtAsc = "submittedat,asc".equals(s);
            boolean bySubmittedAtDesc = "submittedat,desc".equals(s);
            if (bySubmittedAtAsc || bySubmittedAtDesc) {
                java.util.Comparator<com.duanruo.exam.application.dto.ApplicationListItemResponse> cmp =
                        java.util.Comparator.comparing(
                                com.duanruo.exam.application.dto.ApplicationListItemResponse::submittedAt,
                                java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder()));
                if (bySubmittedAtDesc) cmp = cmp.reversed();
                all = all.stream().sorted(cmp).toList();
            }
        }
        int total = all.size();
        int from = Math.max(0, Math.min(page * size, total));
        int to = Math.max(from, Math.min(from + size, total));
        var content = all.subList(from, to);
        int totalPages = (int) Math.ceil(total / (double) size);
        boolean hasNext = page + 1 < totalPages;
        boolean hasPrevious = page > 0;
        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalElements", total,
                "totalPages", totalPages,
                "currentPage", page,
                "pageSize", size,
                "hasNext", hasNext,
                "hasPrevious", hasPrevious
        ));
    }

    @Operation(summary = "保存报名草稿", description = "候选人保存报名草稿（可部分字段）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/drafts")
    @PreAuthorize("hasAuthority('APPLICATION_DRAFT_SAVE')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> saveDraft(
            @RequestBody com.duanruo.exam.application.dto.ApplicationSubmitRequest request,
            @CurrentUserId UUID candidateId) {
        var resp = appService.saveDraft(candidateId, request);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "更新报名草稿", description = "候选人更新自己的报名草稿，仅允许 DRAFT 状态")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/drafts/{id}")
    @PreAuthorize("hasAuthority('APPLICATION_DRAFT_UPDATE')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> updateDraft(
            @PathVariable("id") UUID id,
            @RequestBody com.duanruo.exam.application.dto.ApplicationSubmitRequest request,
            @CurrentUserId UUID candidateId) {
        var resp = appService.updateDraft(id, candidateId, request);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "查看我的报名草稿", description = "候选人查看自己的报名草稿列表（仅 DRAFT）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/drafts/my")
    @PreAuthorize("hasAuthority('APPLICATION_DRAFT_LIST')")
    public ResponseEntity<Map<String, Object>> listMyDrafts(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "10") int size,
            @CurrentUserId UUID candidateId) {
        var all = appService.listMyEnriched(candidateId).stream()
                .filter(a -> "DRAFT".equalsIgnoreCase(a.status()))
                .toList();
        int total = all.size();
        int from = Math.max(0, Math.min(page * size, total));
        int to = Math.max(from, Math.min(from + size, total));
        var content = all.subList(from, to);
        int totalPages = (int) Math.ceil(total / (double) size);
        boolean hasNext = page + 1 < totalPages;
        boolean hasPrevious = page > 0;
        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalElements", total,
                "totalPages", totalPages,
                "currentPage", page,
                "pageSize", size,
                "hasNext", hasNext,
                "hasPrevious", hasPrevious
        ));
    }


    @Operation(summary = "报名审核历史", description = "返回指定申请的审核历史（候选人仅可查看自己的申请；审核员/管理员可查看）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/reviews")
    @PreAuthorize("hasAuthority('APPLICATION_VIEW_OWN') or hasAnyAuthority('APPLICATION_VIEW_ALL','REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> listReviews(
            @PathVariable("id") UUID id,
            Authentication authentication,
            @CurrentUserId UUID userId) {
        org.springframework.security.core.Authentication auth = authentication;
        if (auth == null) {
            auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        }
        String principalId = userId != null ? userId.toString() : null;

        // 只有当用户只有APPLICATION_VIEW_OWN权限（没有APPLICATION_VIEW_ALL或审核权限）时，才认为是候选人
        boolean hasViewAll = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "APPLICATION_VIEW_ALL".equals(a.getAuthority()));
        boolean hasReviewPermission = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "REVIEW_PRIMARY".equals(a.getAuthority()) || "REVIEW_SECONDARY".equals(a.getAuthority()));

        if (!hasViewAll && !hasReviewPermission) {
            var app = appService.getById(id);
            if (app == null || app.candidateId() == null || principalId == null || !app.candidateId().toString().equals(principalId)) {
                return ResponseEntity.status(403).build();
            }
        }
        var logs = auditService.list(id);
        java.util.List<java.util.Map<String, Object>> items = new java.util.ArrayList<>();
        for (var l : logs) {
            String stage = extractStageFromMetadata(l.metadata());
            String decision = deriveDecision(l.toStatus());
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", l.id() == null ? null : l.id().toString());
            m.put("applicationId", l.applicationId() == null ? null : l.applicationId().toString());
            m.put("stage", stage);
            m.put("decision", decision);
            m.put("reviewerName", l.actor());
            m.put("reviewedAt", l.createdAt() == null ? null : l.createdAt().toString());
            m.put("comment", l.reason());
            items.add(m);
        }
        return ResponseEntity.ok(items);
    }

    private String extractStageFromMetadata(String metadata) {
        if (metadata == null || metadata.isBlank()) return null;
        try {
            com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(metadata);
            var s = node.path("stage").asText(null);
            if (s == null || s.isBlank()) return null;
            return switch (s.toUpperCase()) {
                case "PRIMARY" -> "PRIMARY";
                case "SECONDARY" -> "SECONDARY";
                case "AUTO" -> "AUTO";
                default -> null;
            };
        } catch (Exception ignore) {
            return null;
        }
    }

    private String deriveDecision(String toStatus) {
        if (toStatus == null) return null;
        String s = toStatus.toUpperCase();
        if (s.contains("REJECT")) return "REJECTED";
        if (s.contains("APPROVED") || s.contains("PASSED") || s.contains("PAID") || s.contains("TICKET_ISSUED")
                || s.contains("AUTO_PASSED") || s.contains("FINAL_ACCEPTED")) return "APPROVED";
        return "PENDING";
    }

    @Operation(summary = "根据ID获取申请详情", description = "获取指定申请的详细信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('APPLICATION_VIEW_OWN') or hasAnyAuthority('APPLICATION_VIEW_ALL','REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationDetailResponse> getApplicationById(@PathVariable("id") UUID id,
                                                                                                      Authentication authentication,
                                                                                                      @CurrentUserId UUID userId) {
        // 候选人仅可访问自己的申请（保持与 /applications/{id}/reviews 一致的边界）
        // 注意：只有当用户只有APPLICATION_VIEW_OWN权限（没有APPLICATION_VIEW_ALL）时，才认为是候选人
        if (authentication != null && authentication.getAuthorities() != null) {
            boolean hasViewAll = authentication.getAuthorities().stream()
                    .anyMatch(a -> "APPLICATION_VIEW_ALL".equals(a.getAuthority()));
            boolean hasReviewPermission = authentication.getAuthorities().stream()
                    .anyMatch(a -> "REVIEW_PRIMARY".equals(a.getAuthority()) || "REVIEW_SECONDARY".equals(a.getAuthority()));

            // 只有当用户没有VIEW_ALL权限且没有审核权限时，才进行候选人权限检查
            if (!hasViewAll && !hasReviewPermission) {
                var brief = appService.getById(id);
                if (brief == null || brief.candidateId() == null || userId == null || !userId.equals(brief.candidateId())) {
                    return ResponseEntity.status(403).build();
                }
            }
        }
        var resp = appService.getDetailById(id);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "查询申请的审计日志", description = "按时间升序返回指定申请的审计日志列表")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/audit-logs")
    @PreAuthorize("hasAuthority('APPLICATION_VIEW_OWN') or hasAnyAuthority('APPLICATION_VIEW_ALL','REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<List<com.duanruo.exam.application.dto.ApplicationAuditLogItemResponse>> listAuditLogs(
            @PathVariable("id") UUID id) {
        var list = auditService.list(id);
        return ResponseEntity.ok(list);
    }

    @Operation(summary = "撤销报名申请", description = "候选人撤销自己的报名申请")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/{id}/withdraw")
    @PreAuthorize("hasAuthority('APPLICATION_WITHDRAW')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> withdrawApplication(
            @PathVariable("id") UUID id,
            @CurrentUserId UUID userId) {
        var resp = appService.withdraw(id, userId.toString());
        return ResponseEntity.ok(resp);
    }


    @Operation(summary = "重提报名申请", description = "候选人在被退回后，更新表单并重新提交；将自动触发一次自动审核")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/{id}/resubmit")
    @PreAuthorize("hasAuthority('APPLICATION_CREATE')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> resubmit(
            @PathVariable("id") UUID id,
            @RequestBody com.duanruo.exam.application.dto.ApplicationSubmitRequest request,
            @CurrentUserId UUID candidateId) {
        var resp = appService.resubmit(id, candidateId, request);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "上传申请附件", description = "为申请上传支持文件")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/attachments")
    @PreAuthorize("hasAuthority('APPLICATION_ATTACHMENT_UPLOAD')")
    public ResponseEntity<Map<String, Object>> uploadAttachment(
            @PathVariable("id") UUID id,
            @Valid @RequestBody ApplicationAttachmentUploadRequest attachment) {

        // 根据PRD实现附件上传（此处返回演示用预签名URL）
        UUID attachmentId = UUID.randomUUID();

        return ResponseEntity.ok(Map.of(
            "id", attachmentId.toString(),
            "applicationId", id.toString(),
            "filename", attachment.getFilename(),
            "type", attachment.getType(),
            "uploadUrl", "https://minio.example.com/presigned-url/" + attachmentId,
            "message", "附件上传成功"
        ));
    }

    @Operation(summary = "触发自动审核", description = "管理员手动触发自动审核（测试用）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/run-auto-review")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, Object>> runAutoReview(@PathVariable("id") UUID id) {
        var resp = appService.runAutoReview(id);
        String result = switch (resp.status()) {
            case "AUTO_PASSED" -> "AutoPassed";
            case "AUTO_REJECTED" -> "AutoRejected";
            default -> "PendingPrimaryReview";
        };
        return ResponseEntity.ok(Map.of(
            "id", id.toString(),
            "autoReviewResult", result,
            "reason", getAutoReviewReason(result),

            "message", "自动审核完成"
        ));
    }

    @Schema(name = "ReviewDecisionRequest")
    public static record ReviewDecisionRequest(String reason) {}

    // ===== 批量导出（CSV） =====
    @Operation(summary = "导出申请（CSV）", description = "按考试导出报名申请，支持按状态过滤，返回CSV")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping(value = "/export", produces = "text/csv")
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<String> exportCsv(@RequestParam UUID examId,
                                            @RequestParam(required = false) String status,
                                            @CurrentUserId UUID operatorId) {
        String csv = appService.exportCsv(examId, status, operatorId.toString());
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=applications-export.csv")
                .body(csv);
    }

    // ===== 批量导入 =====
    @Operation(summary = "批量导入申请", description = "支持 dryRun 验证与错误报告；非 dryRun 时按项提交并记录审计")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/import")
    @PreAuthorize("hasAuthority('APPLICATION_BULK_OPERATION')")
    public ResponseEntity<Map<String, Object>> importApplications(@RequestBody Map<String, Object> body,
                                                                  @CurrentUserId UUID operatorId) {
        boolean dryRun = Boolean.TRUE.equals(body.get("dryRun")) || "true".equalsIgnoreCase(String.valueOf(body.get("dryRun")));
        @SuppressWarnings("unchecked")
        java.util.List<Map<String, Object>> rawItems = (java.util.List<Map<String, Object>>) body.getOrDefault("items", java.util.List.of());
        java.util.List<com.duanruo.exam.application.service.ApplicationApplicationService.ImportItem> items = new java.util.ArrayList<>();
        for (Map<String, Object> it : rawItems) {
            UUID candidateId = java.util.UUID.fromString(String.valueOf(it.get("candidateId")));
            java.util.UUID examId = java.util.UUID.fromString(String.valueOf(it.get("examId")));
            java.util.UUID positionId = java.util.UUID.fromString(String.valueOf(it.get("positionId")));
            @SuppressWarnings("unchecked") Map<String, Object> payload = (Map<String, Object>) it.getOrDefault("payload", java.util.Map.of());
            @SuppressWarnings("unchecked") java.util.List<Map<String, Object>> att = (java.util.List<Map<String, Object>>) it.getOrDefault("attachments", java.util.List.of());
            java.util.List<com.duanruo.exam.application.dto.ApplicationSubmitRequest.AttachmentRef> attRefs = new java.util.ArrayList<>();
            for (Map<String, Object> a : att) {
                String fileIdStr = String.valueOf(a.get("fileId"));
                java.util.UUID fileId = fileIdStr == null || fileIdStr.isBlank() ? null : java.util.UUID.fromString(fileIdStr);
                String fieldKey = a.get("fieldKey") != null ? String.valueOf(a.get("fieldKey")) : null;
                attRefs.add(new com.duanruo.exam.application.dto.ApplicationSubmitRequest.AttachmentRef(fileId, fieldKey));
            }
            var req = new com.duanruo.exam.application.dto.ApplicationSubmitRequest(examId, positionId, null, payload, attRefs);
            items.add(new com.duanruo.exam.application.service.ApplicationApplicationService.ImportItem(candidateId, req));
        }
        var result = appService.importApplications(dryRun, items, operatorId.toString());
        return ResponseEntity.ok(result);
    }

    // ===== 批量状态迁移 =====
    @Operation(summary = "批量状态迁移", description = "对指定申请批量迁移到目标状态，支持 dryRun 与审计")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/batch/transition")
    @PreAuthorize("hasAuthority('APPLICATION_BULK_OPERATION')")
    public ResponseEntity<Map<String, Object>> batchTransition(@Valid @RequestBody ApplicationBatchTransitionRequest body,
                                                               @CurrentUserId UUID operatorId) {
        boolean dryRun = Boolean.TRUE.equals(body.getDryRun());
        String targetStatus = body.getTargetStatus();
        List<UUID> uuids = body.getApplicationIds();
        var result = appService.batchTransition(dryRun, targetStatus, uuids, operatorId.toString());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "初审通过", description = "初审人员将申请标记为通过，推进到复审")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/primary-approve")
    @PreAuthorize("hasAuthority('REVIEW_PRIMARY')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> primaryApprove(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) ReviewDecisionRequest body) {
        reviewService.applyDecision(id, com.duanruo.exam.domain.application.ApplicationStatus.PRIMARY_PASSED,
                body != null ? body.reason() : null);
        return ResponseEntity.ok(appService.getById(id));
    }

    @Operation(summary = "初审拒绝", description = "初审人员将申请标记为拒绝")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/primary-reject")
    @PreAuthorize("hasAuthority('REVIEW_PRIMARY')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> primaryReject(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) ReviewDecisionRequest body) {
        reviewService.applyDecision(id, com.duanruo.exam.domain.application.ApplicationStatus.PRIMARY_REJECTED,
                body != null ? body.reason() : null);
        return ResponseEntity.ok(appService.getById(id));
    }

    @Operation(summary = "复审通过", description = "复审人员将申请标记为最终通过")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/secondary-approve")
    @PreAuthorize("hasAuthority('REVIEW_SECONDARY')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> secondaryApprove(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) ReviewDecisionRequest body) {
        reviewService.applyDecision(id, com.duanruo.exam.domain.application.ApplicationStatus.APPROVED,
                body != null ? body.reason() : null);
        return ResponseEntity.ok(appService.getById(id));
    }

    @Operation(summary = "复审拒绝", description = "复审人员将申请标记为拒绝")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/secondary-reject")
    @PreAuthorize("hasAuthority('REVIEW_SECONDARY')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationResponse> secondaryReject(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) ReviewDecisionRequest body) {
        reviewService.applyDecision(id, com.duanruo.exam.domain.application.ApplicationStatus.SECONDARY_REJECTED,
                body != null ? body.reason() : null);
        return ResponseEntity.ok(appService.getById(id));
    }



    @Operation(summary = "申请支付", description = "为已通过审核的申请进行支付")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAuthority('APPLICATION_PAY')")
    public ResponseEntity<Map<String, Object>> payApplication(
            @PathVariable("id") UUID id,
            @Valid @RequestBody(required = false) ApplicationPayRequest payment) {

        // 简化：假设支付网关回调成功，直接标记为已付款
        var resp = appService.markPaid(id);

        return ResponseEntity.ok(Map.of(
            ApiConstants.KEY_ID, id.toString(),
            ApiConstants.KEY_STATUS, resp.status(),
            ApiConstants.KEY_MESSAGE, ApiConstants.MSG_PAYMENT_SUCCESS
        ));
    }

    /**
     * 获取自动审核原因
     */
    private String getAutoReviewReason(String result) {
        return switch (result) {
            case "AutoPassed" -> "所有自动审核规则通过";
            case "AutoRejected" -> "年龄不符合要求";
            case "PendingPrimaryReview" -> "学历需要人工验证";
            default -> "未知原因";
        };
    }

    @Operation(summary = "删除草稿", description = "删除草稿状态的报名申请")
    @ApiResponse(responseCode = "204", description = "No Content")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @DeleteMapping("/{id}/draft")
    @PreAuthorize("hasAuthority('APPLICATION_CREATE')")
    public ResponseEntity<Void> deleteDraft(@PathVariable("id") UUID id,
                                           @CurrentUserId UUID candidateId) {
        appService.deleteDraft(id, candidateId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "获取草稿列表", description = "获取当前考生的所有草稿")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/drafts")
    @PreAuthorize("hasAuthority('APPLICATION_VIEW_OWN')")
    public ResponseEntity<List<com.duanruo.exam.application.dto.ApplicationResponse>> listDrafts(
            @CurrentUserId UUID candidateId) {
        List<com.duanruo.exam.application.dto.ApplicationResponse> drafts = appService.listDrafts(candidateId);
        return ResponseEntity.ok(drafts);
    }

    @Operation(summary = "批量导入报名", description = "管理员批量导入考生报名信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/batch-import")
    @PreAuthorize("hasAuthority('APPLICATION_BULK_OPERATION')")
    public ResponseEntity<com.duanruo.exam.application.dto.ApplicationBatchImportResponse> batchImport(
            @Valid @RequestBody com.duanruo.exam.application.dto.ApplicationBatchImportRequest request,
            @CurrentUserId UUID userId) {
        com.duanruo.exam.application.dto.ApplicationBatchImportResponse response =
                appService.batchImport(request, userId.toString());
        return ResponseEntity.ok(response);
    }

    // ===== Excel导入导出 =====

    // TODO: Implement ApplicationExcelService to enable Excel import/export functionality
    // The following endpoints are temporarily disabled until ApplicationExcelService is implemented

    /*
    @Operation(summary = "导出报名数据（Excel）", description = "导出报名数据为Excel文件，支持按状态过滤")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping(value = "/export-excel", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<byte[]> exportExcel(@RequestParam UUID examId,
                                               @RequestParam(required = false) String status,
                                               @CurrentUserId UUID operatorId) {
        try {
            byte[] excelData = excelService.exportToExcel(examId, status);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=applications-export-" + System.currentTimeMillis() + ".xlsx")
                    .body(excelData);
        } catch (Exception e) {
            throw new RuntimeException("导出Excel失败: " + e.getMessage(), e);
        }
    }

    @Operation(summary = "下载导入模板（Excel）", description = "下载报名数据导入模板")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping(value = "/import-template", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasAuthority('APPLICATION_BULK_OPERATION')")
    public ResponseEntity<byte[]> downloadImportTemplate(@RequestParam UUID examId,
                                                          @CurrentUserId UUID operatorId) {
        try {
            byte[] templateData = excelService.generateImportTemplate(examId);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=application-import-template.xlsx")
                    .body(templateData);
        } catch (Exception e) {
            throw new RuntimeException("生成导入模板失败: " + e.getMessage(), e);
        }
    }

    @Operation(summary = "从Excel导入报名数据", description = "从Excel文件导入报名数据")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping(value = "/import-excel", consumes = "multipart/form-data")
    @PreAuthorize("hasAuthority('APPLICATION_BULK_OPERATION')")
    public ResponseEntity<Map<String, Object>> importExcel(@RequestParam UUID examId,
                                                            @RequestParam org.springframework.web.multipart.MultipartFile file,
                                                            @RequestParam(defaultValue = "false") boolean skipErrors,
                                                            @CurrentUserId UUID operatorId) {
        try {
            var result = excelService.importFromExcel(examId, file.getInputStream(), skipErrors);
            return ResponseEntity.ok(Map.of(
                    "total", result.getTotal(),
                    "success", result.getSuccess(),
                    "failed", result.getFailed(),
                    "successIds", result.getSuccessIds(),
                    "failures", result.getFailures()
            ));
        } catch (Exception e) {
            throw new RuntimeException("导入Excel失败: " + e.getMessage(), e);
        }
    }
    */
}
