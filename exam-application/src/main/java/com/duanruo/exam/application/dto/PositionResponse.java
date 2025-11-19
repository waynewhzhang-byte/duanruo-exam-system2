package com.duanruo.exam.application.dto;

/**
 * 岗位响应DTO
 */
public class PositionResponse {

    private String id;
    private String examId;
    private String code;
    private String title;
    private String description;
    private String requirements;
    private Integer quota;

    // Constructors
    public PositionResponse() {}

    private PositionResponse(Builder builder) {
        this.id = builder.id;
        this.examId = builder.examId;
        this.code = builder.code;
        this.title = builder.title;
        this.description = builder.description;
        this.requirements = builder.requirements;
        this.quota = builder.quota;
    }

    public static Builder builder() {
        return new Builder();
    }

    // Getters
    public String getId() { return id; }
    public String getExamId() { return examId; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getRequirements() { return requirements; }
    public Integer getQuota() { return quota; }

    public static class Builder {
        private String id;
        private String examId;
        private String code;
        private String title;
        private String description;
        private String requirements;
        private Integer quota;

        public Builder id(String id) { this.id = id; return this; }
        public Builder examId(String examId) { this.examId = examId; return this; }
        public Builder code(String code) { this.code = code; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder requirements(String requirements) { this.requirements = requirements; return this; }
        public Builder quota(Integer quota) { this.quota = quota; return this; }

        public PositionResponse build() {
            return new PositionResponse(this);
        }
    }
}
