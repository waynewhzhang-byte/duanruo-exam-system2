package com.duanruo.exam.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public class PositionCreateRequest {
    @NotNull
    private UUID examId;
    @NotBlank
    @Size(max = 64)
    private String code;
    @NotBlank
    private String title;
    private String description;
    private String requirements;
    private Integer quota;

    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public Integer getQuota() { return quota; }
    public void setQuota(Integer quota) { this.quota = quota; }
}

