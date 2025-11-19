package com.duanruo.exam.domain.file;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 附件验证结果
 */
public class AttachmentValidationResult {
    
    private final boolean valid;
    private final List<ValidationError> errors;
    
    private AttachmentValidationResult(boolean valid, List<ValidationError> errors) {
        this.valid = valid;
        this.errors = errors != null ? new ArrayList<>(errors) : new ArrayList<>();
    }
    
    public static AttachmentValidationResult success() {
        return new AttachmentValidationResult(true, Collections.emptyList());
    }
    
    public static AttachmentValidationResult failure(List<ValidationError> errors) {
        return new AttachmentValidationResult(false, errors);
    }
    
    public static AttachmentValidationResult failure(ValidationError error) {
        return new AttachmentValidationResult(false, List.of(error));
    }
    
    public boolean isValid() {
        return valid;
    }
    
    public List<ValidationError> getErrors() {
        return Collections.unmodifiableList(errors);
    }
    
    public String getErrorMessage() {
        if (valid) {
            return "";
        }
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < errors.size(); i++) {
            if (i > 0) {
                sb.append("; ");
            }
            sb.append(errors.get(i).getMessage());
        }
        return sb.toString();
    }
    
    /**
     * 验证错误
     */
    public static class ValidationError {
        private final String fieldKey;
        private final String fieldLabel;
        private final ErrorType errorType;
        private final String message;
        private final Object details;
        
        public ValidationError(String fieldKey, String fieldLabel, ErrorType errorType, String message) {
            this(fieldKey, fieldLabel, errorType, message, null);
        }
        
        public ValidationError(String fieldKey, String fieldLabel, ErrorType errorType, String message, Object details) {
            this.fieldKey = fieldKey;
            this.fieldLabel = fieldLabel;
            this.errorType = errorType;
            this.message = message;
            this.details = details;
        }
        
        public String getFieldKey() {
            return fieldKey;
        }
        
        public String getFieldLabel() {
            return fieldLabel;
        }
        
        public ErrorType getErrorType() {
            return errorType;
        }
        
        public String getMessage() {
            return message;
        }
        
        public Object getDetails() {
            return details;
        }
    }
    
    /**
     * 错误类型
     */
    public enum ErrorType {
        MISSING_REQUIRED("缺少必需附件"),
        FILE_NOT_FOUND("文件不存在"),
        FILE_NOT_AVAILABLE("文件不可用"),
        VIRUS_SCAN_FAILED("病毒扫描未通过"),
        VIRUS_SCAN_PENDING("病毒扫描中"),
        INVALID_FILE_TYPE("文件类型不符合要求"),
        FILE_TOO_LARGE("文件大小超过限制"),
        TOO_FEW_FILES("文件数量不足"),
        TOO_MANY_FILES("文件数量超过限制");
        
        private final String description;
        
        ErrorType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}

