package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.application.service.ExamApplicationService;
import com.duanruo.exam.application.service.ApplicationApplicationService;
import com.duanruo.exam.domain.exam.ExamId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 考试管理REST控制器
 */
@RestController
@RequestMapping("/exams")
@Tag(name = "考试管理", description = "考试的创建、查询、更新和删除操作")
public class ExamController {

    private static final Logger logger = LoggerFactory.getLogger(ExamController.class);

    private final ExamApplicationService examApplicationService;
    private final ApplicationApplicationService applicationApplicationService;

    public ExamController(ExamApplicationService examApplicationService,
                         ApplicationApplicationService applicationApplicationService) {
        this.examApplicationService = examApplicationService;
        this.applicationApplicationService = applicationApplicationService;
    }

    @Operation(summary = "获取所有考试", description = "获取系统中所有考试的列表")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "500", description = "Internal Server Error", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping
    @PreAuthorize("hasAnyAuthority('EXAM_VIEW', 'EXAM_VIEW_PUBLIC')")
    public ResponseEntity<List<ExamResponse>> getAllExams() {
        List<ExamResponse> exams = examApplicationService.getAllExams();
        return ResponseEntity.ok(exams);
    }

    @Operation(summary = "根据ID获取考试", description = "根据考试ID获取考试详细信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EXAM_VIEW')")
    public ResponseEntity<ExamResponse> getExamById(@PathVariable("id") UUID id) {
        ExamId examId = ExamId.of(id);
        ExamResponse exam = examApplicationService.getExamById(examId);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "创建新考试", description = "创建一个新的考试（仅租户管理员和超级管理员）")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping
    @PreAuthorize("hasAuthority('EXAM_CREATE')")
    public ResponseEntity<ExamResponse> createExam(@Valid @RequestBody ExamCreateRequest request,
                                                   @CurrentUserId UUID userId) {
        // 调试日志：打印当前认证信息
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        logger.info("Creating exam - User: {}, Authorities: {}", auth != null ? auth.getName() : "null", auth != null ? auth.getAuthorities() : "null");

        ExamResponse exam = examApplicationService.createExam(request, userId.toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(exam);
    }

    @Operation(summary = "更新考试", description = "更新现有考试的信息（仅租户管理员和超级管理员）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EXAM_UPDATE')")
    public ResponseEntity<ExamResponse> updateExam(@PathVariable("id") UUID id,
                                                   @Valid @RequestBody ExamUpdateRequest request) {
        ExamId examId = ExamId.of(id);
        ExamResponse exam = examApplicationService.updateExam(examId, request);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "删除考试", description = "删除指定的考试（仅租户管理员和超级管理员）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EXAM_DELETE')")
    public ResponseEntity<Map<String, String>> removeExamByIdentifier(@PathVariable("id") UUID id) {
        ExamId examId = ExamId.of(id);
        examApplicationService.deleteExam(examId);
        return ResponseEntity.ok(Map.of("message", "考试删除成功"));
    }

    @Operation(summary = "开放考试报名", description = "将考试状态设置为开放报名")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/open")
    @PreAuthorize("hasAuthority('EXAM_OPEN')")
    public ResponseEntity<ExamResponse> openExam(@PathVariable("id") UUID id) {
        ExamId examId = ExamId.of(id);
        ExamResponse exam = examApplicationService.openExam(examId);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "关闭考试报名", description = "将考试状态设置为关闭报名")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('EXAM_CLOSE')")
    public ResponseEntity<ExamResponse> closeExam(@PathVariable("id") UUID id) {
        ExamId examId = ExamId.of(id);
        ExamResponse exam = examApplicationService.closeExam(examId);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "开始考试", description = "将考试状态设置为进行中")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/start")
    @PreAuthorize("hasAuthority('EXAM_START')")
    public ResponseEntity<ExamResponse> startExam(@PathVariable("id") UUID id) {
        ExamId examId = ExamId.of(id);
        ExamResponse exam = examApplicationService.startExam(examId);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "发布考试（别名：开放报名）", description = "将考试状态设置为开放报名，等同于/open端点")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('EXAM_OPEN')")
    public ResponseEntity<ExamResponse> publishExam(@PathVariable("id") UUID id) {
        // 发布考试 = 开放报名
        ExamId examId = ExamId.of(id);
        ExamResponse exam = examApplicationService.openExam(examId);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "取消考试（别名：关闭报名）", description = "将考试状态设置为关闭报名，等同于/close端点")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('EXAM_CLOSE')")
    public ResponseEntity<ExamResponse> cancelExam(@PathVariable("id") UUID id) {
        // 取消考试 = 关闭报名
        ExamId examId = ExamId.of(id);
        ExamResponse exam = examApplicationService.closeExam(examId);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "完成考试", description = "将考试状态设置为已完成")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('EXAM_COMPLETE')")
    public ResponseEntity<ExamResponse> completeExam(@PathVariable("id") UUID id) {
        ExamId examId = ExamId.of(id);
        ExamResponse exam = examApplicationService.completeExam(examId);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "获取考试的岗位列表", description = "获取指定考试下的所有岗位")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/positions")
    public ResponseEntity<List<PositionResponse>> getExamPositions(@PathVariable("id") UUID id) {
        ExamId examId = ExamId.of(id);
        List<PositionResponse> positions = examApplicationService.getExamPositions(examId);
        return ResponseEntity.ok(positions);
    }

    @Schema(name = "AnnouncementUpdateRequest")
    public static record AnnouncementUpdateRequest(String announcement) {}

    @Operation(summary = "获取考试公告", description = "返回指定考试的公告内容（中文）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/announcement")
    public ResponseEntity<Map<String, Object>> getAnnouncement(@PathVariable("id") UUID id) {
        String ann = examApplicationService.getAnnouncement(ExamId.of(id));
        return ResponseEntity.ok(Map.of("announcement", ann == null ? "" : ann));
    }

    @Operation(summary = "更新考试公告", description = "管理员更新指定考试的公告内容（中文）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/{id}/announcement")
    @PreAuthorize("hasAuthority('EXAM_UPDATE')")
    public ResponseEntity<Map<String, Object>> updateAnnouncement(@PathVariable("id") UUID id,
                                                                  @RequestBody AnnouncementUpdateRequest req) {
        String updated = examApplicationService.updateAnnouncement(ExamId.of(id), req.announcement());
        return ResponseEntity.ok(Map.of("announcement", updated == null ? "" : updated));
    }

    @Operation(summary = "获取考试规则配置", description = "返回指定考试的规则配置（自动审核/必需字段/必需附件等）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/rules")
    public ResponseEntity<Map<String, Object>> getRules(@PathVariable("id") UUID id) {
        var rules = examApplicationService.getRules(ExamId.of(id));
        return ResponseEntity.ok(rules);
    }

    @Operation(summary = "更新考试规则配置", description = "管理员更新指定考试的规则配置（自动审核/必需字段/必需附件等）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/{id}/rules")
    @PreAuthorize("hasAuthority('EXAM_FORM_CONFIG')")
    public ResponseEntity<Map<String, Object>> updateRules(@PathVariable("id") UUID id,
                                                           @RequestBody Map<String, Object> rules) {
        var out = examApplicationService.updateRules(ExamId.of(id), rules);
        return ResponseEntity.ok(out);
    }

    @Operation(summary = "获取考试统计信息", description = "获取考试的报名统计、审核统计、岗位统计等信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/statistics")
    @PreAuthorize("hasAuthority('EXAM_VIEW')")
    public ResponseEntity<ExamStatisticsResponse> getExamStatistics(@PathVariable("id") UUID id) {
        ExamStatisticsResponse statistics = examApplicationService.getExamStatistics(ExamId.of(id));
        return ResponseEntity.ok(statistics);
    }

    @Operation(summary = "复制考试", description = "基于现有考试创建新考试，可选择复制岗位、科目等信息")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/copy")
    @PreAuthorize("hasAuthority('EXAM_CREATE')")
    public ResponseEntity<ExamResponse> copyExam(@PathVariable("id") UUID id,
                                                @Valid @RequestBody ExamCopyRequest request,
                                                @CurrentUserId UUID userId) {
        ExamResponse exam = examApplicationService.copyExam(ExamId.of(id), request, userId.toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(exam);
    }

    @Operation(summary = "获取考试的报名列表", description = "获取指定考试的所有报名申请，支持按状态和岗位筛选")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/applications")
    @PreAuthorize("hasAuthority('EXAM_VIEW')")
    public ResponseEntity<List<ApplicationListItemResponse>> getExamApplications(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID positionId) {
        List<ApplicationListItemResponse> applications =
            applicationApplicationService.listByExamEnriched(id, status, positionId);
        return ResponseEntity.ok(applications);
    }

    @Operation(summary = "导出考试报名数据", description = "导出指定考试的报名数据为CSV格式，支持按状态和岗位筛选")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping(value = "/{id}/applications/export", produces = "text/csv")
    @PreAuthorize("hasAuthority('EXAM_VIEW')")
    public ResponseEntity<String> exportExamApplications(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID positionId,
            @CurrentUserId UUID operatorId) {
        String csv = applicationApplicationService.exportCsv(id, status, operatorId.toString());
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=exam-" + id + "-applications.csv")
                .body(csv);
    }

    @Operation(summary = "获取考试报名表单模板", description = "获取考试的报名表单模板（公开访问）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/form-template")
    public ResponseEntity<com.duanruo.exam.application.dto.FormTemplateResponse> getExamFormTemplate(@PathVariable("id") UUID id) {
        var json = examApplicationService.getFormTemplate(id);
        return ResponseEntity.ok(new com.duanruo.exam.application.dto.FormTemplateResponse(id.toString(), json));
    }

    @Operation(summary = "更新考试报名表单模板", description = "更新考试的报名表单模板")
    @ApiResponse(responseCode = "204", description = "No Content")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/{id}/form-template")
    @PreAuthorize("hasAuthority('EXAM_FORM_CONFIG')")
    public ResponseEntity<Void> updateExamFormTemplate(
            @PathVariable("id") UUID id,
            @RequestBody com.duanruo.exam.application.dto.FormTemplateUpdateRequest request) {
        examApplicationService.updateFormTemplate(id, request.getTemplateJson());
        return ResponseEntity.noContent().build();
    }

}
