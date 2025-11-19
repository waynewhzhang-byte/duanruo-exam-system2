package com.duanruo.exam.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 更新考试请求DTO
 */
public class ExamUpdateRequest {

    private String title;
    private String slug;
    private String description;
    private String announcement;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime registrationStart;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime registrationEnd;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime examStart;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime examEnd;

    private Boolean feeRequired;
    private BigDecimal feeAmount;

    // Constructors
    public ExamUpdateRequest() {}

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAnnouncement() {
        return announcement;
    }

    public void setAnnouncement(String announcement) {
        this.announcement = announcement;
    }

    public LocalDateTime getRegistrationStart() {
        return registrationStart;
    }

    public void setRegistrationStart(LocalDateTime registrationStart) {
        this.registrationStart = registrationStart;
    }

    public LocalDateTime getRegistrationEnd() {
        return registrationEnd;
    }

    public void setRegistrationEnd(LocalDateTime registrationEnd) {
        this.registrationEnd = registrationEnd;
    }

    public LocalDateTime getExamStart() {
        return examStart;
    }

    public void setExamStart(LocalDateTime examStart) {
        this.examStart = examStart;
    }

    public LocalDateTime getExamEnd() {
        return examEnd;
    }

    public void setExamEnd(LocalDateTime examEnd) {
        this.examEnd = examEnd;
    }

    public Boolean getFeeRequired() {
        return feeRequired;
    }

    public void setFeeRequired(Boolean feeRequired) {
        this.feeRequired = feeRequired;
    }

    public BigDecimal getFeeAmount() {
        return feeAmount;
    }

    public void setFeeAmount(BigDecimal feeAmount) {
        this.feeAmount = feeAmount;
    }
}
