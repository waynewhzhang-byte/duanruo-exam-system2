package com.duanruo.exam.adapter.rest.dto.tenant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 创建租户请求DTO
 */
public record CreateTenantRequest(
    
    @NotBlank(message = "租户名称不能为空")
    @Size(min = 2, max = 100, message = "租户名称长度必须在2-100之间")
    String name,
    
    @NotBlank(message = "租户代码不能为空")
    @Pattern(regexp = "^[a-z0-9_-]+$", message = "租户代码只能包含小写字母、数字、下划线和连字符")
    @Size(min = 2, max = 50, message = "租户代码长度必须在2-50之间")
    String code,
    
    @NotBlank(message = "联系邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    String contactEmail,
    
    @Size(max = 20, message = "联系电话长度不能超过20")
    String contactPhone,
    
    @Size(max = 500, message = "描述长度不能超过500")
    String description
) {
}

