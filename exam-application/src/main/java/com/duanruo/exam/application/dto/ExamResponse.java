package com.duanruo.exam.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 考试响应DTO
 */
public class ExamResponse {

    private String id;
    private String code;
    private String slug;
    private String title;
    private String description;
    private String announcement;
    private LocalDateTime registrationStart;
    private LocalDateTime registrationEnd;
    private LocalDateTime examStart;
    private LocalDateTime examEnd;
    private Boolean feeRequired;
    private BigDecimal feeAmount;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public ExamResponse() {}

    private ExamResponse(Builder builder) {
        this.id = builder.id;
        this.code = builder.code;
        this.slug = builder.slug;
        this.title = builder.title;
        this.description = builder.description;
        this.announcement = builder.announcement;
        this.registrationStart = builder.registrationStart;
        this.registrationEnd = builder.registrationEnd;
        this.examStart = builder.examStart;
        this.examEnd = builder.examEnd;
        this.feeRequired = builder.feeRequired;
        this.feeAmount = builder.feeAmount;
        this.status = builder.status;
        this.createdBy = builder.createdBy;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    // Getters
    public String getId() { return id; }
    public String getCode() { return code; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getAnnouncement() { return announcement; }
    public LocalDateTime getRegistrationStart() { return registrationStart; }
    public LocalDateTime getRegistrationEnd() { return registrationEnd; }
    public LocalDateTime getExamStart() { return examStart; }
    public LocalDateTime getExamEnd() { return examEnd; }
    public Boolean getFeeRequired() { return feeRequired; }
    public BigDecimal getFeeAmount() { return feeAmount; }
    public String getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public static class Builder {
        private String id;
        private String code;
        private String slug;
        private String title;
        private String description;
        private String announcement;
        private LocalDateTime registrationStart;
        private LocalDateTime registrationEnd;
        private LocalDateTime examStart;
        private LocalDateTime examEnd;
        private Boolean feeRequired;
        private BigDecimal feeAmount;
        private String status;
        private String createdBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder code(String code) { this.code = code; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder announcement(String announcement) { this.announcement = announcement; return this; }
        public Builder registrationStart(LocalDateTime registrationStart) { this.registrationStart = registrationStart; return this; }
        public Builder registrationEnd(LocalDateTime registrationEnd) { this.registrationEnd = registrationEnd; return this; }
        public Builder examStart(LocalDateTime examStart) { this.examStart = examStart; return this; }
        public Builder examEnd(LocalDateTime examEnd) { this.examEnd = examEnd; return this; }
        public Builder feeRequired(Boolean feeRequired) { this.feeRequired = feeRequired; return this; }
        public Builder feeAmount(BigDecimal feeAmount) { this.feeAmount = feeAmount; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder createdBy(String createdBy) { this.createdBy = createdBy; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public ExamResponse build() {
            return new ExamResponse(this);
        }
    }
}
