package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.ReviewStatsApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/reviews")
@Tag(name = "审核统计", description = "审核员个人统计")
public class ReviewStatsController {

    private final ReviewStatsApplicationService statsService;

    public ReviewStatsController(ReviewStatsApplicationService statsService) {
        this.statsService = statsService;
    }

    @Operation(summary = "我的审核统计")
    @ApiResponse(responseCode = "200", description = "OK",
            content = @Content(schema = @Schema(implementation = MyReviewStatsResponse.class)))
    @GetMapping("/stats/me")
    @PreAuthorize("hasAnyAuthority('REVIEW_STATISTICS','REVIEW_PRIMARY','REVIEW_SECONDARY')")
    public ResponseEntity<MyReviewStatsResponse> myStats(@CurrentUserId UUID reviewerId) {
        var s = statsService.getMyStats(reviewerId);
        return ResponseEntity.ok(new MyReviewStatsResponse(s.myAssigned(), s.todayDone(), s.weekDone()));
    }

    public static class MyReviewStatsResponse {
        public int myAssigned;
        public int todayDone;
        public int weekDone;
        public MyReviewStatsResponse(int myAssigned, int todayDone, int weekDone) {
            this.myAssigned = myAssigned;
            this.todayDone = todayDone;
            this.weekDone = weekDone;
        }
    }
}

