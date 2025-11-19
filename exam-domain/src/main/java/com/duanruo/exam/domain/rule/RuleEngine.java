package com.duanruo.exam.domain.rule;

import java.util.Map;

/**
 * 规则引擎接口（Port）
 * 
 * 定义规则引擎的核心能力：
 * 1. 执行规则并返回结果
 * 2. 验证规则配置的有效性
 * 3. 测试规则执行结果
 */
public interface RuleEngine {
    
    /**
     * 执行规则
     * 
     * @param ruleConfig 规则配置（JSON格式）
     * @param context 执行上下文（包含表单数据、用户信息等）
     * @return 规则执行结果
     */
    RuleExecutionResult execute(Map<String, Object> ruleConfig, RuleContext context);
    
    /**
     * 验证规则配置
     * 
     * @param ruleConfig 规则配置
     * @return 验证结果
     */
    RuleValidationResult validate(Map<String, Object> ruleConfig);
    
    /**
     * 测试规则执行
     * 
     * @param ruleConfig 规则配置
     * @param testData 测试数据
     * @return 测试结果
     */
    RuleTestResult test(Map<String, Object> ruleConfig, Map<String, Object> testData);
}

