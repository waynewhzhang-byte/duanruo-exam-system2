package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

/**
 * 报名列表查询请求
 */
@Schema(name = "ApplicationListRequest", description = "报名列表查询请求")
public class ApplicationListRequest {

    @Schema(description = "考试ID")
    private UUID examId;

    @Schema(description = "岗位ID")
    private UUID positionId;

    @Schema(description = "考生ID")
    private UUID candidateId;

    @Schema(description = "状态（多个状态用逗号分隔）")
    private String status;

    @Schema(description = "页码（从0开始）", defaultValue = "0")
    private Integer page = 0;

    @Schema(description = "每页大小", defaultValue = "20")
    private Integer size = 20;

    @Schema(description = "排序字段", defaultValue = "createdAt")
    private String sortBy = "createdAt";

    @Schema(description = "排序方向（ASC/DESC）", defaultValue = "DESC")
    private String sortDirection = "DESC";

    public ApplicationListRequest() {
    }

    // Getters and Setters
    public UUID getExamId() {
        return examId;
    }

    public void setExamId(UUID examId) {
        this.examId = examId;
    }

    public UUID getPositionId() {
        return positionId;
    }

    public void setPositionId(UUID positionId) {
        this.positionId = positionId;
    }

    public UUID getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(UUID candidateId) {
        this.candidateId = candidateId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public String getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection;
    }
}

