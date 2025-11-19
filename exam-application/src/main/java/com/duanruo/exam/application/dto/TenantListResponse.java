package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 租户列表响应DTO（分页）
 */
@Schema(description = "租户列表响应（分页）")
public class TenantListResponse {
    
    @Schema(description = "租户列表")
    private List<TenantResponse> content;
    
    @Schema(description = "总元素数", example = "100")
    private long totalElements;
    
    @Schema(description = "总页数", example = "10")
    private int totalPages;
    
    @Schema(description = "每页大小", example = "10")
    private int size;
    
    @Schema(description = "当前页码（从0开始）", example = "0")
    private int number;
    
    // 构造函数
    public TenantListResponse() {
    }
    
    public TenantListResponse(List<TenantResponse> content, long totalElements, int totalPages, int size, int number) {
        this.content = content;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.size = size;
        this.number = number;
    }
    
    // Getters and Setters
    public List<TenantResponse> getContent() {
        return content;
    }
    
    public void setContent(List<TenantResponse> content) {
        this.content = content;
    }
    
    public long getTotalElements() {
        return totalElements;
    }
    
    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }
    
    public int getTotalPages() {
        return totalPages;
    }
    
    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
    
    public int getSize() {
        return size;
    }
    
    public void setSize(int size) {
        this.size = size;
    }
    
    public int getNumber() {
        return number;
    }
    
    public void setNumber(int number) {
        this.number = number;
    }
}

