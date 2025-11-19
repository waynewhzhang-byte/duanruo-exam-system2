package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.SeatingApplicationService;
import com.duanruo.exam.domain.seating.AllocationStrategy;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
@Tag(name = "座位分配与发证", description = "Seat allocation after registration close, and batch ticket issuing")
public class SeatingController {
    private final SeatingApplicationService seatingService;

    public SeatingController(SeatingApplicationService seatingService) {
        this.seatingService = seatingService;
    }

    @Operation(summary = "执行座位分配（报名关闭后）- 使用默认策略")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/exams/{examId}/allocate-seats")
    @PreAuthorize("hasAuthority('SEATING_ALLOCATE')")
    public ResponseEntity<Map<String, Object>> allocate(@PathVariable("examId") UUID examId, @CurrentUserId UUID userId) {
        var r = seatingService.allocateSeats(examId, userId.toString());
        return ResponseEntity.ok(Map.of(
                "batchId", r.batchId().toString(),
                "totalCandidates", r.totalCandidates(),
                "totalAssigned", r.totalAssigned(),
                "totalVenues", r.totalVenues()
        ));
    }

    @Operation(summary = "执行座位分配（报名关闭后）- 使用指定策略",
               description = "支持多种分配策略：POSITION_FIRST_SUBMITTED_AT（默认）、RANDOM（随机）、SUBMITTED_AT_FIRST（按报名时间）、POSITION_FIRST_RANDOM（岗位分组+随机）、CUSTOM_GROUP（自定义分组）")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/exams/{examId}/allocate-seats-with-strategy")
    @PreAuthorize("hasAuthority('SEATING_ALLOCATE')")
    public ResponseEntity<Map<String, Object>> allocateWithStrategy(
            @PathVariable("examId") UUID examId,
            @Parameter(description = "分配策略", example = "RANDOM")
            @RequestParam(required = false, defaultValue = "POSITION_FIRST_SUBMITTED_AT") String strategy,
            @Parameter(description = "自定义分组字段（仅当strategy为CUSTOM_GROUP时使用）", example = "graduationSchool")
            @RequestParam(required = false) String customGroupField,
            @CurrentUserId UUID userId) {

        AllocationStrategy allocationStrategy = AllocationStrategy.fromCode(strategy);
        var r = seatingService.allocateSeats(examId, allocationStrategy, customGroupField, userId.toString());
        return ResponseEntity.ok(Map.of(
                "batchId", r.batchId().toString(),
                "totalCandidates", r.totalCandidates(),
                "totalAssigned", r.totalAssigned(),
                "totalVenues", r.totalVenues(),
                "strategy", allocationStrategy.getCode(),
                "strategyDescription", allocationStrategy.getDescription()
        ));
    }

    @Operation(summary = "为已分配座位的候选人批量发放准考证")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/exams/{examId}/issue-tickets")
    @PreAuthorize("hasAuthority('TICKET_ISSUE')")
    public ResponseEntity<Map<String, Object>> issueTickets(@PathVariable("examId") UUID examId) {
        var r = seatingService.issueTickets(examId);
        return ResponseEntity.ok(Map.of(
                "totalCandidates", r.totalCandidates(),
                "issued", r.issued()
        ));
    }
}

