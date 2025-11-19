package com.duanruo.exam.adapter.rest.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 岗位管理REST控制器
 * 实现岗位和科目的独立管理功能
 */
@RestController
@RequestMapping("/positions")
@Tag(name = "岗位管理", description = "岗位和科目的创建、查询、更新和删除操作")
public class PositionController {

    private final com.duanruo.exam.application.service.PositionApplicationService positionService;

    public PositionController(com.duanruo.exam.application.service.PositionApplicationService positionService) {
        this.positionService = positionService;
    }

    @Operation(summary = "创建岗位", description = "为指定考试创建新岗位")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping
    @PreAuthorize("hasAuthority('POSITION_CREATE')")
    public ResponseEntity<com.duanruo.exam.application.dto.PositionResponse> createPosition(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true)
            @RequestBody com.duanruo.exam.application.dto.PositionCreateRequest request) {
        var resp = positionService.createPosition(
                request.getExamId(), request.getCode(), request.getTitle(),
                request.getDescription(), request.getRequirements(), request.getQuota());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @Operation(summary = "获取岗位详情", description = "根据岗位ID获取详细信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}")
    public ResponseEntity<com.duanruo.exam.application.dto.PositionResponse> getPositionById(@PathVariable("id") UUID id) {
        var resp = positionService.getPositionById(id);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "更新岗位", description = "更新岗位信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('POSITION_UPDATE')")
    public ResponseEntity<com.duanruo.exam.application.dto.PositionResponse> updatePosition(
            @PathVariable("id") UUID id,
            @RequestBody com.duanruo.exam.application.dto.PositionUpdateRequest request) {
        var resp = positionService.updatePosition(id,
                request.getTitle(), request.getDescription(), request.getRequirements(), request.getQuota());
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "删除岗位", description = "删除指定岗位")
    @ApiResponse(responseCode = "204", description = "No Content")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('POSITION_DELETE')")
    public ResponseEntity<Void> deletePosition(@PathVariable("id") UUID id) {
        positionService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "获取岗位科目列表", description = "获取指定岗位的所有科目")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{id}/subjects")
    public ResponseEntity<List<com.duanruo.exam.application.dto.SubjectResponse>> getPositionSubjects(@PathVariable("id") UUID id) {
        var list = positionService.getPositionSubjects(id).stream().map(s -> {
            var dto = new com.duanruo.exam.application.dto.SubjectResponse();
            dto.setId(s.getId().toString());
            dto.setPositionId(s.getPositionId().toString());
            dto.setName(s.getName());
            dto.setType(s.getType().name());
            dto.setDuration(s.getDurationMinutes());
            dto.setMaxScore(s.getMaxScore());
            dto.setPassingScore(s.getPassingScore());
            dto.setWeight(s.getWeight());
            dto.setOrdering(s.getOrdering());
            dto.setSchedule(s.getSchedule());
            return dto;
        }).toList();
        return ResponseEntity.ok(list);
    }

    @Operation(summary = "创建科目", description = "为指定岗位创建新科目")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{id}/subjects")
    @PreAuthorize("hasAuthority('SUBJECT_CREATE')")
    public ResponseEntity<com.duanruo.exam.application.dto.SubjectResponse> createSubject(
            @PathVariable("id") UUID id,
            @RequestBody com.duanruo.exam.application.dto.SubjectCreateRequest request) {
        var s = positionService.createSubject(id, request.getName(), request.getDuration(), request.getType(),
                request.getMaxScore(), request.getPassingScore(), request.getWeight(), request.getOrdering(), request.getSchedule());
        var dto = new com.duanruo.exam.application.dto.SubjectResponse();
        dto.setId(s.getId().toString());
        dto.setPositionId(s.getPositionId().toString());
        dto.setName(s.getName());
        dto.setType(s.getType().name());
        dto.setDuration(s.getDurationMinutes());
        dto.setMaxScore(s.getMaxScore());
        dto.setPassingScore(s.getPassingScore());
        dto.setWeight(s.getWeight());
        dto.setOrdering(s.getOrdering());
        dto.setSchedule(s.getSchedule());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @Operation(summary = "更新科目", description = "更新科目信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/subjects/{subjectId}")
    @PreAuthorize("hasAuthority('SUBJECT_UPDATE')")
    public ResponseEntity<com.duanruo.exam.application.dto.SubjectResponse> updateSubject(
            @PathVariable("subjectId") UUID subjectId,
            @RequestBody com.duanruo.exam.application.dto.SubjectUpdateRequest request) {
        var s = positionService.updateSubject(subjectId, request.getName(), request.getDuration(), request.getType(),
                request.getMaxScore(), request.getPassingScore(), request.getWeight(), request.getOrdering(), request.getSchedule());
        var dto = new com.duanruo.exam.application.dto.SubjectResponse();
        dto.setId(s.getId().toString());
        dto.setPositionId(s.getPositionId().toString());
        dto.setName(s.getName());
        dto.setType(s.getType().name());
        dto.setDuration(s.getDurationMinutes());
        dto.setMaxScore(s.getMaxScore());
        dto.setPassingScore(s.getPassingScore());
        dto.setWeight(s.getWeight());
        dto.setOrdering(s.getOrdering());
        dto.setSchedule(s.getSchedule());
        return ResponseEntity.ok(dto);
    }

    @Operation(summary = "删除科目", description = "删除指定科目")
    @ApiResponse(responseCode = "204", description = "No Content")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @DeleteMapping("/subjects/{subjectId}")
    @PreAuthorize("hasAuthority('SUBJECT_DELETE')")
    public ResponseEntity<Void> deleteSubject(@PathVariable("subjectId") UUID subjectId) {
        positionService.deleteSubject(subjectId);
        return ResponseEntity.noContent().build();
    }
}
