package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.TicketNumberRuleApplicationService;
import com.duanruo.exam.domain.ticket.TicketNumberRule;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * 准考证编号规则管理控制器
 */
@RestController
@RequestMapping("/exams/{examId}/ticket-number-rule")
@Tag(name = "准考证编号规则管理", description = "管理准考证编号生成规则")
public class TicketNumberRuleController {

    private final TicketNumberRuleApplicationService ruleService;

    public TicketNumberRuleController(TicketNumberRuleApplicationService ruleService) {
        this.ruleService = ruleService;
    }

    /**
     * 获取准考证编号规则
     */
    @GetMapping
    @Operation(summary = "获取准考证编号规则", description = "获取指定考试的准考证编号生成规则")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, Object>> getRule(@PathVariable UUID examId) {
        Map<String, Object> rule = ruleService.getTemplate(examId);
        return ResponseEntity.ok(rule);
    }

    /**
     * 更新准考证编号规则
     */
    @PutMapping
    @Operation(summary = "更新准考证编号规则", description = "更新指定考试的准考证编号生成规则")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, Object>> updateRule(
            @PathVariable UUID examId,
            @RequestBody Map<String, Object> request) {
        
        ruleService.updateTemplate(examId, request);
        
        return ResponseEntity.ok(Map.of(
                "message", "准考证编号规则更新成功",
                "examId", examId.toString()
        ));
    }

    /**
     * 重置准考证编号规则为默认值
     */
    @DeleteMapping
    @Operation(summary = "重置准考证编号规则", description = "将准考证编号规则重置为默认值")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, Object>> resetRule(@PathVariable UUID examId) {
        ruleService.resetTemplate(examId);
        
        return ResponseEntity.ok(Map.of(
                "message", "准考证编号规则已重置为默认值",
                "examId", examId.toString()
        ));
    }

    /**
     * 预览准考证编号
     */
    @PostMapping("/preview")
    @Operation(summary = "预览准考证编号", description = "根据当前规则预览生成的准考证编号")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, Object>> previewTicketNumber(
            @PathVariable UUID examId,
            @RequestBody Map<String, Object> request) {
        
        String examCode = (String) request.getOrDefault("examCode", "EXAM001");
        String positionCode = (String) request.getOrDefault("positionCode", "POS001");
        
        // 生成预览编号（使用序列号1）
        String previewNumber = ruleService.generateNumber(
                examId,
                examCode,
                positionCode,
                java.time.LocalDate.now()
        );
        
        return ResponseEntity.ok(Map.of(
                "previewNumber", previewNumber,
                "examCode", examCode,
                "positionCode", positionCode,
                "date", java.time.LocalDate.now().toString()
        ));
    }

    /**
     * 获取可用的配置选项
     */
    @GetMapping("/options")
    @Operation(summary = "获取配置选项", description = "获取准考证编号规则的所有可用配置选项")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, Object>> getOptions() {
        return ResponseEntity.ok(Map.of(
                "dateFormats", new String[]{
                        "NONE",      // 不包含日期
                        "YYYYMMDD",  // 20251021
                        "YYMMDD",    // 251021
                        "YYYYMM",    // 202510
                        "YYMM"       // 2510
                },
                "checksumTypes", new String[]{
                        "NONE",      // 无校验位
                        "LUHN",      // Luhn算法
                        "MODULO_11", // Modulo 11算法
                        "MODULO_10"  // Modulo 10算法
                },
                "defaultSeparator", "-",
                "sequenceLengthRange", Map.of(
                        "min", 1,
                        "max", 10
                ),
                "examples", Map.of(
                        "basic", "EXAM001-POS001-20251021-0001",
                        "withPrefix", "2025-EXAM001-POS001-20251021-0001",
                        "withChecksum", "EXAM001-POS001-20251021-0001-3",
                        "noDate", "EXAM001-POS001-0001",
                        "customSeparator", "EXAM001_POS001_20251021_0001"
                )
        ));
    }
}

