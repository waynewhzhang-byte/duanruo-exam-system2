package com.duanruo.exam.adapter.rest.dto.tenant;

import com.duanruo.exam.domain.user.Role;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * 授予角色请求DTO
 */
public record GrantRoleRequest(
    
    @NotNull(message = "用户ID不能为空")
    UUID userId,
    
    @NotNull(message = "角色不能为空")
    Role role
) {
}

