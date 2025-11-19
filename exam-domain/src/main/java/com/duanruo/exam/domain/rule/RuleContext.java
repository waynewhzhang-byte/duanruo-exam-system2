package com.duanruo.exam.domain.rule;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 规则执行上下文
 * 
 * 包含规则执行所需的所有数据：
 * - 表单数据（payload）
 * - 用户信息
 * - 考试信息
 * - 岗位信息
 * - 附件信息
 */
public class RuleContext {
    
    private final UUID examId;
    private final UUID positionId;
    private final UUID candidateId;
    private final Map<String, Object> formData;
    private final Map<String, Object> userInfo;
    private final Map<String, Object> examInfo;
    private final Map<String, Object> positionInfo;
    private final Map<String, String> attachments; // fieldKey -> fileId
    
    private RuleContext(Builder builder) {
        this.examId = builder.examId;
        this.positionId = builder.positionId;
        this.candidateId = builder.candidateId;
        this.formData = builder.formData;
        this.userInfo = builder.userInfo;
        this.examInfo = builder.examInfo;
        this.positionInfo = builder.positionInfo;
        this.attachments = builder.attachments;
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    // Getters
    public UUID getExamId() {
        return examId;
    }
    
    public UUID getPositionId() {
        return positionId;
    }
    
    public UUID getCandidateId() {
        return candidateId;
    }
    
    public Map<String, Object> getFormData() {
        return formData;
    }
    
    public Map<String, Object> getUserInfo() {
        return userInfo;
    }
    
    public Map<String, Object> getExamInfo() {
        return examInfo;
    }
    
    public Map<String, Object> getPositionInfo() {
        return positionInfo;
    }
    
    public Map<String, String> getAttachments() {
        return attachments;
    }
    
    /**
     * 获取表单字段值
     */
    public Object getFormField(String fieldName) {
        return formData != null ? formData.get(fieldName) : null;
    }
    
    /**
     * 获取用户信息字段
     */
    public Object getUserField(String fieldName) {
        return userInfo != null ? userInfo.get(fieldName) : null;
    }
    
    /**
     * 检查附件是否存在
     */
    public boolean hasAttachment(String fieldKey) {
        return attachments != null && attachments.containsKey(fieldKey);
    }
    
    /**
     * Builder模式
     */
    public static class Builder {
        private UUID examId;
        private UUID positionId;
        private UUID candidateId;
        private Map<String, Object> formData = new HashMap<>();
        private Map<String, Object> userInfo = new HashMap<>();
        private Map<String, Object> examInfo = new HashMap<>();
        private Map<String, Object> positionInfo = new HashMap<>();
        private Map<String, String> attachments = new HashMap<>();
        
        public Builder examId(UUID examId) {
            this.examId = examId;
            return this;
        }
        
        public Builder positionId(UUID positionId) {
            this.positionId = positionId;
            return this;
        }
        
        public Builder candidateId(UUID candidateId) {
            this.candidateId = candidateId;
            return this;
        }
        
        public Builder formData(Map<String, Object> formData) {
            this.formData = formData != null ? formData : new HashMap<>();
            return this;
        }
        
        public Builder userInfo(Map<String, Object> userInfo) {
            this.userInfo = userInfo != null ? userInfo : new HashMap<>();
            return this;
        }
        
        public Builder examInfo(Map<String, Object> examInfo) {
            this.examInfo = examInfo != null ? examInfo : new HashMap<>();
            return this;
        }
        
        public Builder positionInfo(Map<String, Object> positionInfo) {
            this.positionInfo = positionInfo != null ? positionInfo : new HashMap<>();
            return this;
        }
        
        public Builder attachments(Map<String, String> attachments) {
            this.attachments = attachments != null ? attachments : new HashMap<>();
            return this;
        }
        
        public RuleContext build() {
            return new RuleContext(this);
        }
    }
}

