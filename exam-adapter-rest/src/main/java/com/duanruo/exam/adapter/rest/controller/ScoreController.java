package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.score.AbsentMarkRequest;
import com.duanruo.exam.application.dto.score.ScoreRankingResponse;
import com.duanruo.exam.application.dto.score.ScoreRecordRequest;
import com.duanruo.exam.application.dto.score.ScoreResponse;
import com.duanruo.exam.application.dto.score.ScoreStatisticsResponse;
import com.duanruo.exam.application.service.InterviewEligibilityService;
import com.duanruo.exam.application.service.ScoreApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 成绩管理控制器
 * 提供成绩录入、查询、统计等API
 */
@RestController
@RequestMapping("/scores")
@Tag(name = "成绩管理", description = "成绩的录入、查询和统计API")
public class ScoreController {

    private final ScoreApplicationService scoreService;
    private final InterviewEligibilityService interviewEligibilityService;

    public ScoreController(ScoreApplicationService scoreService,
                          InterviewEligibilityService interviewEligibilityService) {
        this.scoreService = scoreService;
        this.interviewEligibilityService = interviewEligibilityService;
    }

    /**
     * 录入成绩
     */
    @PostMapping("/record")
    @PreAuthorize("hasAuthority('SCORE_RECORD')")
    public ResponseEntity<Map<String, String>> recordScore(@Valid @RequestBody ScoreRecordRequest request,
                                                          @CurrentUserId UUID gradedBy) {

        scoreService.recordScore(
            request.applicationId(),
            request.subjectId(),
            request.score(),
            gradedBy,
            request.remarks()
        );

        return ResponseEntity.ok(Map.of("message", "成绩录入成功"));
    }

    /**
     * 标记缺考
     */
    @PostMapping("/absent")
    @PreAuthorize("hasAuthority('SCORE_RECORD')")
    public ResponseEntity<Map<String, String>> markAsAbsent(@Valid @RequestBody AbsentMarkRequest request,
                                                           @CurrentUserId UUID gradedBy) {

        scoreService.markAsAbsent(
            request.applicationId(),
            request.subjectId(),
            gradedBy,
            request.remarks()
        );

        return ResponseEntity.ok(Map.of("message", "缺考标记成功"));
    }

    /**
     * 查询申请的所有成绩
     */
    @Operation(summary = "查询申请的所有成绩", description = "候选人可查看自己的成绩，管理员可查看任意申请的成绩")
@ApiResponse(responseCode = "200", description = "OK",
        content = @Content(array = @ArraySchema(schema = @Schema(implementation = ScoreResponse.class))))
@GetMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyAuthority('SCORE_VIEW', 'SCORE_VIEW_OWN')")
    public ResponseEntity<List<ScoreResponse>> getScoresByApplication(@PathVariable("applicationId") UUID applicationId,
                                                                     @CurrentUserId UUID requesterId) {

        List<ScoreResponse> scores = scoreService.getScoresByApplication(applicationId, requesterId);
        return ResponseEntity.ok(scores);
    }

    /**
     * 查询考试成绩统计
     */
    @Operation(summary = "查询考试成绩统计", description = "查看指定考试的成绩统计数据")
@ApiResponse(responseCode = "200", description = "OK",
        content = @Content(schema = @Schema(implementation = ScoreStatisticsResponse.class)))
@GetMapping("/statistics/exam/{examId}")
    @PreAuthorize("hasAuthority('SCORE_STATISTICS')")
    public ResponseEntity<ScoreStatisticsResponse> getScoreStatistics(@PathVariable("examId") UUID examId,
                                                                     @CurrentUserId UUID requesterId) {

        ScoreStatisticsResponse statistics = scoreService.getScoreStatistics(examId, requesterId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * 查询成绩排名
     */
    @Operation(summary = "查询成绩排名", description = "查看指定考试或岗位的成绩排名")
    @ApiResponse(responseCode = "200", description = "OK",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ScoreRankingResponse.class))))
    @GetMapping("/ranking/exam/{examId}")
    @PreAuthorize("hasAuthority('SCORE_STATISTICS')")
    public ResponseEntity<List<ScoreRankingResponse>> getRanking(
            @PathVariable("examId") UUID examId,
            @RequestParam(value = "positionId", required = false) UUID positionId,
            @CurrentUserId UUID requesterId) {

        List<ScoreRankingResponse> rankings = scoreService.calculateRanking(examId, positionId, requesterId);
        return ResponseEntity.ok(rankings);
    }

    /**
     * 检查面试资格
     */
    @GetMapping("/application/{applicationId}/interview-eligibility")
    @PreAuthorize("hasAnyAuthority('SCORE_VIEW', 'SCORE_VIEW_OWN')")
    public ResponseEntity<Map<String, Object>> checkInterviewEligibility(@PathVariable("applicationId") UUID applicationId) {
        boolean eligible = interviewEligibilityService.checkInterviewEligibility(applicationId);

        return ResponseEntity.ok(Map.of(
            "applicationId", applicationId,
            "eligibleForInterview", eligible
        ));
    }

    /**
     * 更新面试资格状态
     */
    @PostMapping("/application/{applicationId}/update-interview-eligibility")
    @PreAuthorize("hasAuthority('SCORE_RECORD')")
    public ResponseEntity<Map<String, String>> updateInterviewEligibility(@PathVariable("applicationId") UUID applicationId) {
        interviewEligibilityService.updateInterviewEligibilityStatus(applicationId);

        return ResponseEntity.ok(Map.of("message", "面试资格状态更新成功"));
    }

    /**
     * 批量更新考试的面试资格状态
     */
    @PostMapping("/exam/{examId}/batch-update-interview-eligibility")
    @PreAuthorize("hasAuthority('SCORE_RECORD')")
    public ResponseEntity<Map<String, Object>> batchUpdateInterviewEligibility(@PathVariable("examId") UUID examId) {
        int updatedCount = interviewEligibilityService.batchUpdateInterviewEligibility(examId);

        return ResponseEntity.ok(Map.of(
            "message", "批量更新完成",
            "updatedCount", updatedCount
        ));
    }

    /**
     * 获取面试资格统计
     */
    @GetMapping("/exam/{examId}/interview-eligibility-statistics")
    @PreAuthorize("hasAuthority('SCORE_STATISTICS')")
    public ResponseEntity<InterviewEligibilityService.InterviewEligibilityStatistics> getInterviewEligibilityStatistics(
            @PathVariable("examId") UUID examId) {

        InterviewEligibilityService.InterviewEligibilityStatistics statistics =
            interviewEligibilityService.getInterviewEligibilityStatistics(examId);

        return ResponseEntity.ok(statistics);
    }

    /**
     * 根据科目查询成绩
     */
    @Operation(summary = "根据科目查询成绩", description = "查询指定科目的所有成绩")
    @ApiResponse(responseCode = "200", description = "OK",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ScoreResponse.class))))
    @GetMapping("/subject/{subjectId}")
    @PreAuthorize("hasAuthority('SCORE_VIEW')")
    public ResponseEntity<List<ScoreResponse>> getScoresBySubject(@PathVariable("subjectId") UUID subjectId,
                                                                  @CurrentUserId UUID requesterId) {
        List<ScoreResponse> scores = scoreService.getScoresBySubject(subjectId, requesterId);
        return ResponseEntity.ok(scores);
    }

    /**
     * 根据考试查询所有成绩
     */
    @Operation(summary = "根据考试查询所有成绩", description = "查询指定考试的所有成绩")
    @ApiResponse(responseCode = "200", description = "OK",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ScoreResponse.class))))
    @GetMapping("/exam/{examId}")
    @PreAuthorize("hasAuthority('SCORE_VIEW')")
    public ResponseEntity<List<ScoreResponse>> getScoresByExam(@PathVariable("examId") UUID examId,
                                                               @CurrentUserId UUID requesterId) {
        List<ScoreResponse> scores = scoreService.getScoresByExam(examId, requesterId);
        return ResponseEntity.ok(scores);
    }

    /**
     * 删除成绩记录
     */
    @Operation(summary = "删除成绩记录", description = "删除指定的成绩记录")
    @ApiResponse(responseCode = "200", description = "OK")
    @DeleteMapping("/{scoreId}")
    @PreAuthorize("hasAuthority('SCORE_DELETE')")
    public ResponseEntity<Map<String, String>> deleteScore(@PathVariable("scoreId") UUID scoreId,
                                                          @CurrentUserId UUID requesterId) {
        scoreService.deleteScore(scoreId, requesterId);
        return ResponseEntity.ok(Map.of("message", "成绩删除成功"));
    }

    /**
     * 批量录入成绩
     */
    @PostMapping("/batch-record")
    @PreAuthorize("hasAuthority('SCORE_BATCH_IMPORT')")
    public ResponseEntity<Map<String, Object>> batchRecordScores(@RequestBody List<ScoreRecordRequest> requests,
                                                                @CurrentUserId UUID gradedBy) {

        int successCount = 0;
        int failCount = 0;

        for (ScoreRecordRequest request : requests) {
            try {
                scoreService.recordScore(
                    request.applicationId(),
                    request.subjectId(),
                    request.score(),
                    gradedBy,
                    request.remarks()
                );
                successCount++;
            } catch (Exception e) {
                failCount++;
                // TODO: 记录错误日志
            }
        }

        return ResponseEntity.ok(Map.of(
            "message", "批量录入完成",
            "successCount", successCount,
            "failCount", failCount,
            "totalCount", requests.size()
        ));
    }

    /**
     * 导出考试成绩为Excel
     */
    @Operation(summary = "导出考试成绩", description = "导出指定考试的所有成绩为Excel文件")
    @ApiResponse(responseCode = "200", description = "OK",
            content = @Content(mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
    @GetMapping("/exam/{examId}/export")
    @PreAuthorize("hasAuthority('SCORE_VIEW')")
    public ResponseEntity<byte[]> exportScores(@PathVariable("examId") UUID examId,
                                                @CurrentUserId UUID requesterId) throws IOException {
        byte[] excelBytes = scoreService.exportScoresToExcel(examId, requesterId);
        
        String filename = "成绩表_" + examId + "_" + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(excelBytes.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelBytes);
    }
}
