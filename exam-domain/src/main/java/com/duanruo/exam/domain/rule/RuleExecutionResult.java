package com.duanruo.exam.domain.rule;

import java.util.ArrayList;
import java.util.List;

/**
 * 规则执行结果
 */
public class RuleExecutionResult {
    
    private final boolean passed;
    private final String action; // PASS, REJECT, PENDING_REVIEW
    private final String reason;
    private final List<String> matchedRules;
    private final List<String> failedRules;
    
    private RuleExecutionResult(boolean passed, String action, String reason, 
                               List<String> matchedRules, List<String> failedRules) {
        this.passed = passed;
        this.action = action;
        this.reason = reason;
        this.matchedRules = matchedRules != null ? matchedRules : new ArrayList<>();
        this.failedRules = failedRules != null ? failedRules : new ArrayList<>();
    }
    
    public static RuleExecutionResult pass(String reason) {
        return new RuleExecutionResult(true, "PASS", reason, new ArrayList<>(), new ArrayList<>());
    }
    
    public static RuleExecutionResult pass(String reason, List<String> matchedRules) {
        return new RuleExecutionResult(true, "PASS", reason, matchedRules, new ArrayList<>());
    }
    
    public static RuleExecutionResult reject(String reason) {
        return new RuleExecutionResult(false, "REJECT", reason, new ArrayList<>(), new ArrayList<>());
    }
    
    public static RuleExecutionResult reject(String reason, List<String> failedRules) {
        return new RuleExecutionResult(false, "REJECT", reason, new ArrayList<>(), failedRules);
    }
    
    public static RuleExecutionResult pendingReview(String reason) {
        return new RuleExecutionResult(false, "PENDING_REVIEW", reason, new ArrayList<>(), new ArrayList<>());
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
    
    public List<String> getMatchedRules() {
        return matchedRules;
    }
    
    public List<String> getFailedRules() {
        return failedRules;
    }
}

