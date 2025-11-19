package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.ExamResponse;
import com.duanruo.exam.application.dto.PositionResponse;
import com.duanruo.exam.application.service.ExamApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 公开考试访问REST控制器
 * 提供无需认证的考试信息查询接口，支持通过slug访问考试
 */
@RestController
@RequestMapping("/public/exams")
@Tag(name = "公开考试访问", description = "无需认证的考试信息查询接口，支持通过URL后缀访问考试")
public class PublicExamController {

    private final ExamApplicationService examApplicationService;

    public PublicExamController(ExamApplicationService examApplicationService) {
        this.examApplicationService = examApplicationService;
    }

    @Operation(summary = "通过slug获取考试信息",
               description = "通过考试URL后缀获取考试详细信息，无需认证。用于公开考试页面展示。")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found",
                 content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/slug/{slug}")
    public ResponseEntity<ExamResponse> getExamBySlug(@PathVariable String slug) {
        ExamResponse exam = examApplicationService.getExamBySlug(slug);
        return ResponseEntity.ok(exam);
    }

    @Operation(summary = "通过slug获取考试岗位列表",
               description = "通过考试URL后缀获取考试下的所有岗位信息，无需认证。")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found",
                 content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/slug/{slug}/positions")
    public ResponseEntity<List<PositionResponse>> getExamPositionsBySlug(@PathVariable String slug) {
        List<PositionResponse> positions = examApplicationService.getExamPositionsBySlug(slug);
        return ResponseEntity.ok(positions);
    }

    @Operation(summary = "通过slug获取考试公告",
               description = "通过考试URL后缀获取考试公告内容，无需认证。")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found",
                 content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/slug/{slug}/announcement")
    public ResponseEntity<Map<String, Object>> getAnnouncementBySlug(@PathVariable String slug) {
        String announcement = examApplicationService.getAnnouncementBySlug(slug);
        return ResponseEntity.ok(Map.of("announcement", announcement == null ? "" : announcement));
    }

    @Operation(summary = "获取开放报名的考试列表",
               description = "获取所有状态为开放报名的考试列表，无需认证。用于公开考试列表页面。")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/open")
    public ResponseEntity<List<ExamResponse>> getOpenExams() {
        List<ExamResponse> exams = examApplicationService.getOpenExams();
        return ResponseEntity.ok(exams);
    }
}
