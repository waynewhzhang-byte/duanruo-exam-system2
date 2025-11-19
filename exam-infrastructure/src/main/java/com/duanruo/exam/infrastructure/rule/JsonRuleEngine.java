package com.duanruo.exam.infrastructure.rule;

import com.duanruo.exam.domain.rule.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 基于JSON的规则引擎实现
 * 
 * 支持的规则类型：
 * 1. 字段值匹配规则（equals, in, contains, regex）
 * 2. 数值比较规则（gt, gte, lt, lte, between）
 * 3. 逻辑组合规则（and, or, not）
 * 4. 附件存在性规则（hasAttachment）
 * 5. 自定义脚本规则（future）
 */
@Component
public class JsonRuleEngine implements RuleEngine {
    
    private static final Logger log = LoggerFactory.getLogger(JsonRuleEngine.class);
    
    @Override
    public RuleExecutionResult execute(Map<String, Object> ruleConfig, RuleContext context) {
        if (ruleConfig == null || ruleConfig.isEmpty()) {
            return RuleExecutionResult.pendingReview("无规则配置，进入人工审核");
        }
        
        try {
            // 获取规则列表
            Object rulesObj = ruleConfig.get("rules");
            if (!(rulesObj instanceof List<?> rulesList)) {
                return RuleExecutionResult.pendingReview("规则配置格式错误");
            }
            
            List<String> matchedRules = new ArrayList<>();
            List<String> failedRules = new ArrayList<>();
            
            // 执行每条规则
            for (Object ruleObj : rulesList) {
                if (!(ruleObj instanceof Map<?, ?> rule)) {
                    continue;
                }
                
                @SuppressWarnings("unchecked")
                Map<String, Object> ruleMap = (Map<String, Object>) rule;
                
                String ruleName = (String) ruleMap.getOrDefault("name", "unnamed");
                String ruleType = (String) ruleMap.get("type");
                String action = (String) ruleMap.getOrDefault("action", "PENDING_REVIEW");
                
                boolean matched = evaluateRule(ruleMap, context);
                
                if (matched) {
                    matchedRules.add(ruleName);
                    log.debug("[RuleEngine] 规则匹配: {}", ruleName);
                    
                    // 根据action返回结果
                    String reason = (String) ruleMap.getOrDefault("reason", "匹配规则: " + ruleName);
                    
                    if ("PASS".equals(action) || "AUTO_PASS".equals(action)) {
                        return RuleExecutionResult.pass(reason, matchedRules);
                    } else if ("REJECT".equals(action) || "AUTO_REJECT".equals(action)) {
                        failedRules.add(ruleName);
                        return RuleExecutionResult.reject(reason, failedRules);
                    }
                }
            }
            
            // 所有规则都不匹配，进入人工审核
            return RuleExecutionResult.pendingReview("未匹配任何自动审核规则");
            
        } catch (Exception e) {
            log.error("[RuleEngine] 规则执行失败", e);
            return RuleExecutionResult.pendingReview("规则执行异常: " + e.getMessage());
        }
    }
    
    @Override
    public RuleValidationResult validate(Map<String, Object> ruleConfig) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        
        if (ruleConfig == null || ruleConfig.isEmpty()) {
            warnings.add("规则配置为空");
            return RuleValidationResult.validWithWarnings(warnings);
        }
        
        // 验证rules字段
        Object rulesObj = ruleConfig.get("rules");
        if (rulesObj == null) {
            errors.add("缺少rules字段");
            return RuleValidationResult.invalid(errors);
        }
        
        if (!(rulesObj instanceof List<?>)) {
            errors.add("rules字段必须是数组");
            return RuleValidationResult.invalid(errors);
        }
        
        List<?> rulesList = (List<?>) rulesObj;
        if (rulesList.isEmpty()) {
            warnings.add("规则列表为空");
        }
        
        // 验证每条规则
        for (int i = 0; i < rulesList.size(); i++) {
            Object ruleObj = rulesList.get(i);
            if (!(ruleObj instanceof Map<?, ?>)) {
                errors.add("规则[" + i + "]格式错误，必须是对象");
                continue;
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> rule = (Map<String, Object>) ruleObj;
            
            // 验证必需字段
            if (!rule.containsKey("type")) {
                errors.add("规则[" + i + "]缺少type字段");
            }
            
            if (!rule.containsKey("action")) {
                warnings.add("规则[" + i + "]缺少action字段，将使用默认值PENDING_REVIEW");
            }
            
            // 验证规则类型
            String type = (String) rule.get("type");
            if (type != null && !isValidRuleType(type)) {
                errors.add("规则[" + i + "]类型不支持: " + type);
            }
        }
        
        if (!errors.isEmpty()) {
            return RuleValidationResult.invalid(errors);
        }
        
        if (!warnings.isEmpty()) {
            return RuleValidationResult.validWithWarnings(warnings);
        }
        
        return RuleValidationResult.valid();
    }
    
    @Override
    public RuleTestResult test(Map<String, Object> ruleConfig, Map<String, Object> testData) {
        List<String> executionLog = new ArrayList<>();
        Map<String, Object> debugInfo = new HashMap<>();
        
        executionLog.add("开始测试规则");
        
        // 构建测试上下文
        RuleContext context = RuleContext.builder()
                .formData(testData)
                .build();
        
        executionLog.add("测试数据: " + testData);
        
        // 执行规则
        RuleExecutionResult result = execute(ruleConfig, context);
        
        executionLog.add("执行结果: " + result.getAction());
        executionLog.add("原因: " + result.getReason());
        
        debugInfo.put("matchedRules", result.getMatchedRules());
        debugInfo.put("failedRules", result.getFailedRules());
        
        return RuleTestResult.of(result, executionLog, debugInfo);
    }
    
    /**
     * 评估单条规则
     */
    private boolean evaluateRule(Map<String, Object> rule, RuleContext context) {
        String type = (String) rule.get("type");
        
        return switch (type) {
            case "fieldEquals" -> evaluateFieldEquals(rule, context);
            case "fieldIn" -> evaluateFieldIn(rule, context);
            case "fieldContains" -> evaluateFieldContains(rule, context);
            case "fieldRegex" -> evaluateFieldRegex(rule, context);
            case "fieldGt" -> evaluateFieldGt(rule, context);
            case "fieldGte" -> evaluateFieldGte(rule, context);
            case "fieldLt" -> evaluateFieldLt(rule, context);
            case "fieldLte" -> evaluateFieldLte(rule, context);
            case "fieldBetween" -> evaluateFieldBetween(rule, context);
            case "hasAttachment" -> evaluateHasAttachment(rule, context);
            case "and" -> evaluateAnd(rule, context);
            case "or" -> evaluateOr(rule, context);
            case "not" -> evaluateNot(rule, context);
            default -> {
                log.warn("[RuleEngine] 不支持的规则类型: {}", type);
                yield false;
            }
        };
    }
    
    /**
     * 字段等于
     */
    private boolean evaluateFieldEquals(Map<String, Object> rule, RuleContext context) {
        String field = (String) rule.get("field");
        Object expectedValue = rule.get("value");
        Object actualValue = context.getFormField(field);
        
        if (actualValue == null) {
            return expectedValue == null;
        }
        
        return actualValue.toString().equals(expectedValue.toString());
    }
    
    /**
     * 字段在列表中
     */
    private boolean evaluateFieldIn(Map<String, Object> rule, RuleContext context) {
        String field = (String) rule.get("field");
        Object valuesObj = rule.get("values");
        
        if (!(valuesObj instanceof List<?>)) {
            return false;
        }
        
        List<?> values = (List<?>) valuesObj;
        Object actualValue = context.getFormField(field);
        
        if (actualValue == null) {
            return false;
        }
        
        String actualStr = actualValue.toString();
        for (Object value : values) {
            if (actualStr.equals(value.toString())) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 字段包含
     */
    private boolean evaluateFieldContains(Map<String, Object> rule, RuleContext context) {
        String field = (String) rule.get("field");
        String substring = (String) rule.get("substring");
        Object actualValue = context.getFormField(field);
        
        if (actualValue == null || substring == null) {
            return false;
        }
        
        return actualValue.toString().contains(substring);
    }
    
    /**
     * 字段正则匹配
     */
    private boolean evaluateFieldRegex(Map<String, Object> rule, RuleContext context) {
        String field = (String) rule.get("field");
        String pattern = (String) rule.get("pattern");
        Object actualValue = context.getFormField(field);
        
        if (actualValue == null || pattern == null) {
            return false;
        }
        
        return actualValue.toString().matches(pattern);
    }
    
    /**
     * 字段大于
     */
    private boolean evaluateFieldGt(Map<String, Object> rule, RuleContext context) {
        return compareNumeric(rule, context, (actual, expected) -> actual > expected);
    }
    
    /**
     * 字段大于等于
     */
    private boolean evaluateFieldGte(Map<String, Object> rule, RuleContext context) {
        return compareNumeric(rule, context, (actual, expected) -> actual >= expected);
    }
    
    /**
     * 字段小于
     */
    private boolean evaluateFieldLt(Map<String, Object> rule, RuleContext context) {
        return compareNumeric(rule, context, (actual, expected) -> actual < expected);
    }
    
    /**
     * 字段小于等于
     */
    private boolean evaluateFieldLte(Map<String, Object> rule, RuleContext context) {
        return compareNumeric(rule, context, (actual, expected) -> actual <= expected);
    }
    
    /**
     * 字段在范围内
     */
    private boolean evaluateFieldBetween(Map<String, Object> rule, RuleContext context) {
        String field = (String) rule.get("field");
        Object minObj = rule.get("min");
        Object maxObj = rule.get("max");
        Object actualValue = context.getFormField(field);
        
        if (actualValue == null || minObj == null || maxObj == null) {
            return false;
        }
        
        try {
            double actual = Double.parseDouble(actualValue.toString());
            double min = Double.parseDouble(minObj.toString());
            double max = Double.parseDouble(maxObj.toString());
            
            return actual >= min && actual <= max;
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    /**
     * 附件存在
     */
    private boolean evaluateHasAttachment(Map<String, Object> rule, RuleContext context) {
        String fieldKey = (String) rule.get("fieldKey");
        return context.hasAttachment(fieldKey);
    }
    
    /**
     * 逻辑与
     */
    private boolean evaluateAnd(Map<String, Object> rule, RuleContext context) {
        Object conditionsObj = rule.get("conditions");
        if (!(conditionsObj instanceof List<?>)) {
            return false;
        }
        
        List<?> conditions = (List<?>) conditionsObj;
        for (Object conditionObj : conditions) {
            if (!(conditionObj instanceof Map<?, ?>)) {
                return false;
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> condition = (Map<String, Object>) conditionObj;
            
            if (!evaluateRule(condition, context)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 逻辑或
     */
    private boolean evaluateOr(Map<String, Object> rule, RuleContext context) {
        Object conditionsObj = rule.get("conditions");
        if (!(conditionsObj instanceof List<?>)) {
            return false;
        }
        
        List<?> conditions = (List<?>) conditionsObj;
        for (Object conditionObj : conditions) {
            if (!(conditionObj instanceof Map<?, ?>)) {
                continue;
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> condition = (Map<String, Object>) conditionObj;
            
            if (evaluateRule(condition, context)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 逻辑非
     */
    private boolean evaluateNot(Map<String, Object> rule, RuleContext context) {
        Object conditionObj = rule.get("condition");
        if (!(conditionObj instanceof Map<?, ?>)) {
            return false;
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> condition = (Map<String, Object>) conditionObj;
        
        return !evaluateRule(condition, context);
    }
    
    /**
     * 数值比较辅助方法
     */
    private boolean compareNumeric(Map<String, Object> rule, RuleContext context, NumericComparator comparator) {
        String field = (String) rule.get("field");
        Object valueObj = rule.get("value");
        Object actualValue = context.getFormField(field);
        
        if (actualValue == null || valueObj == null) {
            return false;
        }
        
        try {
            double actual = Double.parseDouble(actualValue.toString());
            double expected = Double.parseDouble(valueObj.toString());
            
            return comparator.compare(actual, expected);
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    /**
     * 检查规则类型是否有效
     */
    private boolean isValidRuleType(String type) {
        return Set.of(
            "fieldEquals", "fieldIn", "fieldContains", "fieldRegex",
            "fieldGt", "fieldGte", "fieldLt", "fieldLte", "fieldBetween",
            "hasAttachment", "and", "or", "not"
        ).contains(type);
    }
    
    @FunctionalInterface
    private interface NumericComparator {
        boolean compare(double actual, double expected);
    }
}

