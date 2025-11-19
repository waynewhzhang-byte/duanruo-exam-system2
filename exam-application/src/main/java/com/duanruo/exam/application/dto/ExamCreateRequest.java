package com.duanruo.exam.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 创建考试请求DTO
 */
public class ExamCreateRequest {

    @NotBlank(message = "考试代码不能为空")
    private String code;

    private String slug;

    @NotBlank(message = "考试标题不能为空")
    private String title;

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
    public ExamCreateRequest() {}

    public ExamCreateRequest(String code, String title, String description) {
        this.code = code;
        this.title = title;
        this.description = description;
    }

    // Getters and Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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
}
