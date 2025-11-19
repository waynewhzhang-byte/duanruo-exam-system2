package com.duanruo.exam.domain.rule;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 规则测试结果
 */
public class RuleTestResult {
    
    private final boolean passed;
    private final String action;
    private final String reason;
    private final List<String> executionLog;
    private final Map<String, Object> debugInfo;
    
    private RuleTestResult(boolean passed, String action, String reason, 
                          List<String> executionLog, Map<String, Object> debugInfo) {
        this.passed = passed;
        this.action = action;
        this.reason = reason;
        this.executionLog = executionLog != null ? executionLog : new ArrayList<>();
        this.debugInfo = debugInfo != null ? Map.of() : debugInfo;
    }
    
    public static RuleTestResult of(RuleExecutionResult executionResult, 
                                   List<String> executionLog, 
                                   Map<String, Object> debugInfo) {
        return new RuleTestResult(
            executionResult.isPassed(),
            executionResult.getAction(),
            executionResult.getReason(),
            executionLog,
            debugInfo
        );
    }
    
    // Getters
    public boolean isPassed() {
        return passed;
    }
    
    public String getAction() {
        return action;
    }
    
    public String getReason() {
        return reason;
    }
    
    public List<String> getExecutionLog() {
        return executionLog;
    }
    
    public Map<String, Object> getDebugInfo() {
        return debugInfo;
    }
}

