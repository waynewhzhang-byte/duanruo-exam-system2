package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.SeatMapDTO;
import com.duanruo.exam.application.service.VenueApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
@Tag(name = "考场管理", description = "考场CRUD与查询")
public class VenueController {
    private final VenueApplicationService venueService;

    public VenueController(VenueApplicationService venueService) { this.venueService = venueService; }

    @Operation(summary = "创建考场")
    @ApiResponse(responseCode = "201", description = "Created")
    @PostMapping("/exams/{examId}/venues")
    @PreAuthorize("hasAuthority('VENUE_CREATE')")
    public ResponseEntity<?> create(@PathVariable("examId") UUID examId,
                                    @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        Integer capacity = body.get("capacity") != null ? ((Number) body.get("capacity")).intValue() : null;
        var v = venueService.create(examId, name, capacity);
        return ResponseEntity.status(201).body(Map.of(
                "venueId", v.getId().getValue().toString(),
                "examId", v.getExamId().getValue().toString(),
                "name", v.getName(),
                "capacity", v.getCapacity()
        ));
    }

    @Operation(summary = "列出考试的考场")
    @GetMapping("/exams/{examId}/venues")
    @PreAuthorize("hasAuthority('VENUE_LIST')")
    public ResponseEntity<?> list(@PathVariable("examId") UUID examId) {
        var list = venueService.listByExam(examId).stream().map(v -> Map.of(
                "venueId", v.getId().getValue().toString(),
                "name", v.getName(),
                "capacity", v.getCapacity()
        )).toList();
        return ResponseEntity.ok(Map.of("items", list, "total", list.size()));
    }

    @Operation(summary = "更新考场")
    @PutMapping("/venues/{venueId}")
    @PreAuthorize("hasAuthority('VENUE_UPDATE')")
    public ResponseEntity<?> update(@PathVariable("venueId") UUID venueId,
                                    @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        Integer capacity = body.get("capacity") != null ? ((Number) body.get("capacity")).intValue() : null;
        String seatMapJson = (String) body.get("seatMap");
        venueService.update(venueId, name, capacity, seatMapJson);
        return ResponseEntity.ok(Map.of("venueId", venueId.toString(), "message", "updated"));
    }

    @Operation(summary = "删除考场")
    @DeleteMapping("/venues/{venueId}")
    @PreAuthorize("hasAuthority('VENUE_DELETE')")
    public ResponseEntity<?> delete(@PathVariable("venueId") UUID venueId) {
        venueService.delete(venueId);
        return ResponseEntity.noContent().build();
    }

    // 座位地图管理

    @Operation(summary = "创建座位地图", description = "为考场创建座位布局地图")
    @ApiResponse(responseCode = "201", description = "Created")
    @PostMapping("/venues/{venueId}/seat-map")
    @PreAuthorize("hasAuthority('VENUE_UPDATE')")
    public ResponseEntity<SeatMapDTO> createSeatMap(
            @PathVariable("venueId") UUID venueId,
            @Parameter(description = "行数", example = "10")
            @RequestParam int rows,
            @Parameter(description = "列数", example = "10")
            @RequestParam int columns) {
        SeatMapDTO seatMap = venueService.createSeatMap(venueId, rows, columns);
        return ResponseEntity.status(201).body(seatMap);
    }

    @Operation(summary = "获取座位地图", description = "获取考场的座位布局地图")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/venues/{venueId}/seat-map")
    @PreAuthorize("hasAuthority('VENUE_LIST')")
    public ResponseEntity<SeatMapDTO> getSeatMap(@PathVariable("venueId") UUID venueId) {
        SeatMapDTO seatMap = venueService.getSeatMap(venueId);
        if (seatMap == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(seatMap);
    }

    @Operation(summary = "更新座位状态", description = "更新指定座位的状态（AVAILABLE, UNAVAILABLE, AISLE）")
    @ApiResponse(responseCode = "200", description = "OK")
    @PutMapping("/venues/{venueId}/seat-map/seats/{row}/{col}/status")
    @PreAuthorize("hasAuthority('VENUE_UPDATE')")
    public ResponseEntity<?> updateSeatStatus(
            @PathVariable("venueId") UUID venueId,
            @PathVariable("row") int row,
            @PathVariable("col") int col,
            @Parameter(description = "座位状态", example = "UNAVAILABLE")
            @RequestParam String status) {
        venueService.updateSeatStatus(venueId, row, col, status);
        return ResponseEntity.ok(Map.of("message", "座位状态已更新"));
    }

    @Operation(summary = "更新座位标签", description = "更新指定座位的标签（如 A1, B2）")
    @ApiResponse(responseCode = "200", description = "OK")
    @PutMapping("/venues/{venueId}/seat-map/seats/{row}/{col}/label")
    @PreAuthorize("hasAuthority('VENUE_UPDATE')")
    public ResponseEntity<?> updateSeatLabel(
            @PathVariable("venueId") UUID venueId,
            @PathVariable("row") int row,
            @PathVariable("col") int col,
            @Parameter(description = "座位标签", example = "A1")
            @RequestParam String label) {
        venueService.updateSeatLabel(venueId, row, col, label);
        return ResponseEntity.ok(Map.of("message", "座位标签已更新"));
    }
}

