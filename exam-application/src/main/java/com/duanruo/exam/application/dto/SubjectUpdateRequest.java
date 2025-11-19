package com.duanruo.exam.application.dto;

import com.duanruo.exam.domain.exam.SubjectType;

import java.math.BigDecimal;

public class SubjectUpdateRequest {
    private String name;
    private Integer duration;
    private SubjectType type;
    private BigDecimal maxScore;
    private BigDecimal passingScore;
    private BigDecimal weight;
    private Integer ordering;
    private String schedule;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public SubjectType getType() { return type; }
    public void setType(SubjectType type) { this.type = type; }
    public BigDecimal getMaxScore() { return maxScore; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    public BigDecimal getPassingScore() { return passingScore; }
    public void setPassingScore(BigDecimal passingScore) { this.passingScore = passingScore; }
    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }
    public Integer getOrdering() { return ordering; }
    public void setOrdering(Integer ordering) { this.ordering = ordering; }
    public String getSchedule() { return schedule; }
    public void setSchedule(String schedule) { this.schedule = schedule; }
}

