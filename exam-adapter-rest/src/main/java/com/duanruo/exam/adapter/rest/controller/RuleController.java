package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.RuleApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * 规则管理控制器
 * 
 * 提供规则引擎的REST接口：
 * 1. 验证规则配置
 * 2. 测试规则执行
 * 3. 执行规则（用于调试）
 */
@RestController
@RequestMapping("/rules")
@Tag(name = "规则管理", description = "规则引擎配置和测试")
public class RuleController {
    
    private final RuleApplicationService ruleApplicationService;
    
    public RuleController(RuleApplicationService ruleApplicationService) {
        this.ruleApplicationService = ruleApplicationService;
    }
    
    /**
     * 验证规则配置
     */
    @Operation(summary = "验证规则配置", description = "验证规则配置的语法和结构是否正确")
    @PostMapping("/validate")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<RuleApplicationService.RuleValidationResultDTO> validateRule(
            @RequestBody Map<String, Object> ruleConfig) {
        
        RuleApplicationService.RuleValidationResultDTO result = 
                ruleApplicationService.validateRule(ruleConfig);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 测试规则执行
     */
    @Operation(summary = "测试规则执行", description = "使用测试数据测试规则执行结果")
    @PostMapping("/test")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<RuleApplicationService.RuleTestResultDTO> testRule(
            @RequestBody TestRuleRequest request) {
        
        RuleApplicationService.RuleTestResultDTO result = 
                ruleApplicationService.testRule(request.ruleConfig(), request.testData());
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 执行规则（调试用）
     */
    @Operation(summary = "执行规则", description = "执行规则并返回结果（用于调试）")
    @PostMapping("/execute")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<RuleApplicationService.RuleExecutionResultDTO> executeRule(
            @RequestBody ExecuteRuleRequest request) {
        
        RuleApplicationService.RuleExecutionResultDTO result = 
                ruleApplicationService.executeRule(
                        request.ruleConfig(),
                        request.examId(),
                        request.positionId(),
                        request.candidateId(),
                        request.formData()
                );
        
        return ResponseEntity.ok(result);
    }
    
    // Request DTOs
    
    public record TestRuleRequest(
            Map<String, Object> ruleConfig,
            Map<String, Object> testData
    ) {}
    
    public record ExecuteRuleRequest(
            Map<String, Object> ruleConfig,
            UUID examId,
            UUID positionId,
            UUID candidateId,
            Map<String, Object> formData
    ) {}
}

