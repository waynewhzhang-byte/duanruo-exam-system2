package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.ExamReviewerResponse;
import com.duanruo.exam.application.service.ExamReviewerApplicationService;
import com.duanruo.exam.adapter.rest.dto.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/exams/{examId}/reviewers")
@Tag(name = "考试审核员关联", description = "管理考试与审核员的关联关系")
public class ExamReviewerController {

    private final ExamReviewerApplicationService examReviewerApplicationService;

    public ExamReviewerController(ExamReviewerApplicationService examReviewerApplicationService) {
        this.examReviewerApplicationService = examReviewerApplicationService;
    }

    @Operation(summary = "列出审核员", description = "列出某考试下已关联的审核员（包括用户详细信息）")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping
    @PreAuthorize("hasAuthority('EXAM_VIEW')")
    public ResponseEntity<List<ExamReviewerResponse>> list(@PathVariable("examId") UUID examId) {
        List<ExamReviewerResponse> reviewers = examReviewerApplicationService.getExamReviewers(examId);
        return ResponseEntity.ok(reviewers);
    }

    @Operation(summary = "添加审核员", description = "为考试添加审核员（指定角色：PRIMARY_REVIEWER或SECONDARY_REVIEWER）")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @PostMapping
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, String>> add(@PathVariable("examId") UUID examId,
                                                   @Valid @RequestBody AddReviewerRequest body) {
        examReviewerApplicationService.addReviewer(examId, body.userId(), body.role());
        return ResponseEntity.ok(Map.of("message", "审核员添加成功"));
    }

    @Operation(summary = "移除审核员", description = "移除考试的审核员")
    @ApiResponse(responseCode = "200", description = "OK")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, String>> remove(@PathVariable("examId") UUID examId,
                                                      @PathVariable("id") Long id,
                                                      @RequestParam String role) {
        // 需要先查询获取 reviewerId
        List<ExamReviewerResponse> reviewers = examReviewerApplicationService.getExamReviewers(examId);
        ExamReviewerResponse reviewer = reviewers.stream()
                .filter(r -> r.getId().equals(id.toString()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("审核员不存在"));

        examReviewerApplicationService.removeReviewer(examId, UUID.fromString(reviewer.getUserId()), role);
        return ResponseEntity.ok(Map.of("message", "审核员移除成功"));
    }

    @Operation(summary = "获取可用审核员", description = "获取可以添加为审核员的用户列表")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/available")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<List<Map<String, Object>>> getAvailableReviewers() {
        List<Map<String, Object>> reviewers = examReviewerApplicationService.getAvailableReviewers();
        return ResponseEntity.ok(reviewers);
    }

    // DTO
    public record AddReviewerRequest(UUID userId, String role) {}


}

