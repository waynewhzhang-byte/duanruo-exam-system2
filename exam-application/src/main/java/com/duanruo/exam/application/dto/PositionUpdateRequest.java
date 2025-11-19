package com.duanruo.exam.application.dto;

public class PositionUpdateRequest {
    private String title;
    private String description;
    private String requirements;
    private Integer quota;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public Integer getQuota() { return quota; }
    public void setQuota(Integer quota) { this.quota = quota; }
}

