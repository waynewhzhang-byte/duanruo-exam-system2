package com.duanruo.exam.domain.file;

import java.util.List;

/**
 * 附件要求值对象
 * 定义某个字段的附件上传要求
 */
public class AttachmentRequirement {
    
    private final String fieldKey;
    private final String fieldLabel;
    private final boolean required;
    private final Integer minFiles;
    private final Integer maxFiles;
    private final Long maxFileSize; // 字节
    private final List<String> allowedExtensions;
    private final String category;
    
    private AttachmentRequirement(Builder builder) {
        this.fieldKey = builder.fieldKey;
        this.fieldLabel = builder.fieldLabel;
        this.required = builder.required;
        this.minFiles = builder.minFiles;
        this.maxFiles = builder.maxFiles;
        this.maxFileSize = builder.maxFileSize;
        this.allowedExtensions = builder.allowedExtensions;
        this.category = builder.category;
        
        validate();
    }
    
    private void validate() {
        if (fieldKey == null || fieldKey.isBlank()) {
            throw new IllegalArgumentException("fieldKey不能为空");
        }
        if (minFiles != null && minFiles < 0) {
            throw new IllegalArgumentException("minFiles不能为负数");
        }
        if (maxFiles != null && maxFiles < 0) {
            throw new IllegalArgumentException("maxFiles不能为负数");
        }
        if (minFiles != null && maxFiles != null && minFiles > maxFiles) {
            throw new IllegalArgumentException("minFiles不能大于maxFiles");
        }
        if (maxFileSize != null && maxFileSize <= 0) {
            throw new IllegalArgumentException("maxFileSize必须大于0");
        }
    }
    
    public String getFieldKey() {
        return fieldKey;
    }
    
    public String getFieldLabel() {
        return fieldLabel;
    }
    
    public boolean isRequired() {
        return required;
    }
    
    public Integer getMinFiles() {
        return minFiles;
    }
    
    public Integer getMaxFiles() {
        return maxFiles;
    }
    
    public Long getMaxFileSize() {
        return maxFileSize;
    }
    
    public List<String> getAllowedExtensions() {
        return allowedExtensions;
    }
    
    public String getCategory() {
        return category;
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String fieldKey;
        private String fieldLabel;
        private boolean required = false;
        private Integer minFiles;
        private Integer maxFiles;
        private Long maxFileSize;
        private List<String> allowedExtensions;
        private String category;
        
        public Builder fieldKey(String fieldKey) {
            this.fieldKey = fieldKey;
            return this;
        }
        
        public Builder fieldLabel(String fieldLabel) {
            this.fieldLabel = fieldLabel;
            return this;
        }
        
        public Builder required(boolean required) {
            this.required = required;
            return this;
        }
        
        public Builder minFiles(Integer minFiles) {
            this.minFiles = minFiles;
            return this;
        }
        
        public Builder maxFiles(Integer maxFiles) {
            this.maxFiles = maxFiles;
            return this;
        }
        
        public Builder maxFileSize(Long maxFileSize) {
            this.maxFileSize = maxFileSize;
            return this;
        }
        
        public Builder allowedExtensions(List<String> allowedExtensions) {
            this.allowedExtensions = allowedExtensions;
            return this;
        }
        
        public Builder category(String category) {
            this.category = category;
            return this;
        }
        
        public AttachmentRequirement build() {
            return new AttachmentRequirement(this);
        }
    }
}

