package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.rule.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * 规则应用服务
 * 
 * 提供规则引擎的应用层接口：
 * 1. 执行规则
 * 2. 验证规则配置
 * 3. 测试规则
 */
@Service
@Transactional(readOnly = true)
public class RuleApplicationService {
    
    private final RuleEngine ruleEngine;
    
    public RuleApplicationService(RuleEngine ruleEngine) {
        this.ruleEngine = ruleEngine;
    }
    
    /**
     * 执行规则
     * 
     * @param ruleConfig 规则配置
     * @param examId 考试ID
     * @param positionId 岗位ID
     * @param candidateId 考生ID
     * @param formData 表单数据
     * @return 执行结果
     */
    public RuleExecutionResultDTO executeRule(
            Map<String, Object> ruleConfig,
            UUID examId,
            UUID positionId,
            UUID candidateId,
            Map<String, Object> formData) {
        
        // 构建规则上下文
        RuleContext context = RuleContext.builder()
                .examId(examId)
                .positionId(positionId)
                .candidateId(candidateId)
                .formData(formData)
                .build();
        
        // 执行规则
        RuleExecutionResult result = ruleEngine.execute(ruleConfig, context);
        
        // 转换为DTO
        return new RuleExecutionResultDTO(
                result.isPassed(),
                result.getAction(),
                result.getReason(),
                result.getMatchedRules(),
                result.getFailedRules()
        );
    }
    
    /**
     * 验证规则配置
     * 
     * @param ruleConfig 规则配置
     * @return 验证结果
     */
    public RuleValidationResultDTO validateRule(Map<String, Object> ruleConfig) {
        RuleValidationResult result = ruleEngine.validate(ruleConfig);
        
        return new RuleValidationResultDTO(
                result.isValid(),
                result.getErrors(),
                result.getWarnings()
        );
    }
    
    /**
     * 测试规则
     * 
     * @param ruleConfig 规则配置
     * @param testData 测试数据
     * @return 测试结果
     */
    public RuleTestResultDTO testRule(Map<String, Object> ruleConfig, Map<String, Object> testData) {
        RuleTestResult result = ruleEngine.test(ruleConfig, testData);
        
        return new RuleTestResultDTO(
                result.isPassed(),
                result.getAction(),
                result.getReason(),
                result.getExecutionLog(),
                result.getDebugInfo()
        );
    }
    
    // DTOs
    
    public record RuleExecutionResultDTO(
            boolean passed,
            String action,
            String reason,
            java.util.List<String> matchedRules,
            java.util.List<String> failedRules
    ) {}
    
    public record RuleValidationResultDTO(
            boolean valid,
            java.util.List<String> errors,
            java.util.List<String> warnings
    ) {}
    
    public record RuleTestResultDTO(
            boolean passed,
            String action,
            String reason,
            java.util.List<String> executionLog,
            Map<String, Object> debugInfo
    ) {}
}

