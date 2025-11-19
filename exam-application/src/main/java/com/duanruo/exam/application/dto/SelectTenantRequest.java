package com.duanruo.exam.application.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 选择租户请求DTO
 */
public class SelectTenantRequest {
    
    @NotBlank(message = "租户ID不能为空")
    private String tenantId;
    
    // 构造函数
    public SelectTenantRequest() {}
    
    public SelectTenantRequest(String tenantId) {
        this.tenantId = tenantId;
    }
    
    // Getters and Setters
    public String getTenantId() {
        return tenantId;
    }
    
    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}

