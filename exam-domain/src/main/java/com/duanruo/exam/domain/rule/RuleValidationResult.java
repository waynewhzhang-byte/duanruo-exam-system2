package com.duanruo.exam.domain.rule;

import java.util.ArrayList;
import java.util.List;

/**
 * 规则验证结果
 */
public class RuleValidationResult {
    
    private final boolean valid;
    private final List<String> errors;
    private final List<String> warnings;
    
    private RuleValidationResult(boolean valid, List<String> errors, List<String> warnings) {
        this.valid = valid;
        this.errors = errors != null ? errors : new ArrayList<>();
        this.warnings = warnings != null ? warnings : new ArrayList<>();
    }
    
    public static RuleValidationResult valid() {
        return new RuleValidationResult(true, new ArrayList<>(), new ArrayList<>());
    }
    
    public static RuleValidationResult invalid(List<String> errors) {
        return new RuleValidationResult(false, errors, new ArrayList<>());
    }
    
    public static RuleValidationResult validWithWarnings(List<String> warnings) {
        return new RuleValidationResult(true, new ArrayList<>(), warnings);
    }
    
    // Getters
    public boolean isValid() {
        return valid;
    }
    
    public List<String> getErrors() {
        return errors;
    }
    
    public List<String> getWarnings() {
        return warnings;
    }
}

