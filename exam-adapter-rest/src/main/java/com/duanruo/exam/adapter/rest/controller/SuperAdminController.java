package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.dto.tenant.CreateTenantRequest;
import com.duanruo.exam.adapter.rest.dto.tenant.TenantResponse;
import com.duanruo.exam.adapter.rest.dto.tenant.UpdateTenantRequest;
import com.duanruo.exam.application.dto.TenantListResponse;
import com.duanruo.exam.application.service.TenantApplicationService;
import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.shared.domain.TenantId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 超级管理员REST API
 * 提供超级管理员专用的租户管理功能
 */
@RestController
@RequestMapping("/super-admin")
@Tag(name = "超级管理员", description = "超级管理员专用操作")
public class SuperAdminController {
    
    private static final Logger logger = LoggerFactory.getLogger(SuperAdminController.class);
    
    private final TenantApplicationService tenantApplicationService;
    
    public SuperAdminController(TenantApplicationService tenantApplicationService) {
        this.tenantApplicationService = tenantApplicationService;
    }
    
    /**
     * 列出所有租户（仅超级管理员）
     */
    @Operation(
        summary = "获取租户列表",
        description = "获取所有租户列表（仅超级管理员）"
    )
    @ApiResponse(
        responseCode = "200",
        description = "成功获取租户列表",
        content = @Content(schema = @Schema(implementation = TenantListResponse.class))
    )
    @ApiResponse(
        responseCode = "403",
        description = "权限不足"
    )
    @GetMapping("/tenants")
    @PreAuthorize("hasAuthority('TENANT_VIEW_ALL')")
    public ResponseEntity<TenantListResponse> listTenants(
            @Parameter(description = "页码（从0开始）", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "仅显示激活的租户", example = "false")
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly
    ) {
        logger.info("Super admin listing tenants (activeOnly: {}, page: {}, size: {})", activeOnly, page, size);

        try {
            // 获取租户列表
            List<Tenant> tenants = activeOnly
                ? tenantApplicationService.listActiveTenants()
                : tenantApplicationService.listAllTenants();

            // 转换为前端期望的DTO格式
            List<com.duanruo.exam.application.dto.TenantResponse> tenantResponses = tenants.stream()
                    .map(com.duanruo.exam.application.dto.TenantResponse::fromDomain)
                    .collect(Collectors.toList());

            // 简单的内存分页（生产环境应该在数据库层面分页）
            int start = page * size;
            int end = Math.min(start + size, tenantResponses.size());

            List<com.duanruo.exam.application.dto.TenantResponse> pagedContent = start < tenantResponses.size()
                    ? tenantResponses.subList(start, end)
                    : List.of();

            int totalElements = tenantResponses.size();
            int totalPages = (int) Math.ceil((double) totalElements / size);

            TenantListResponse response = new TenantListResponse(
                    pagedContent,
                    totalElements,
                    totalPages,
                    size,
                    page
            );

            logger.info("Successfully retrieved {} tenants", totalElements);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error listing tenants", e);
            throw e;
        }
    }
    
    /**
     * 创建租户（仅超级管理员）
     */
    @Operation(summary = "创建租户", description = "创建新的租户实例（仅超级管理员）")
    @ApiResponse(responseCode = "201", description = "创建成功")
    @ApiResponse(responseCode = "400", description = "请求参数错误")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping("/tenants")
    @PreAuthorize("hasAuthority('TENANT_CREATE')")
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody CreateTenantRequest request) {
        
        logger.info("Super admin creating tenant with code: {}", request.code());
        
        TenantId tenantId = tenantApplicationService.createTenant(
            request.name(),
            request.code(),
            request.contactEmail(),
            request.contactPhone(),
            request.description()
        );
        
        Tenant tenant = tenantApplicationService.getTenant(tenantId.getValue());
        TenantResponse response = TenantResponse.from(tenant);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 获取租户详情（仅超级管理员）
     */
    @Operation(summary = "获取租户详情", description = "根据ID获取租户详细信息（仅超级管理员）")
    @ApiResponse(responseCode = "200", description = "成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @GetMapping("/tenants/{id}")
    @PreAuthorize("hasAuthority('TENANT_VIEW')")
    public ResponseEntity<TenantResponse> getTenant(@PathVariable UUID id) {
        logger.debug("Super admin getting tenant: {}", id);

        Tenant tenant = tenantApplicationService.getTenant(id);
        TenantResponse response = TenantResponse.from(tenant);

        return ResponseEntity.ok(response);
    }
    
    /**
     * 更新租户信息（仅超级管理员）
     */
    @Operation(summary = "更新租户信息", description = "更新租户的基本信息（仅超级管理员）")
    @ApiResponse(responseCode = "200", description = "更新成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PutMapping("/tenants/{id}")
    @PreAuthorize("hasAuthority('TENANT_UPDATE')")
    public ResponseEntity<TenantResponse> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequest request) {

        logger.info("Super admin updating tenant: {}", id);

        tenantApplicationService.updateTenant(
            id,
            request.name(),
            request.contactEmail(),
            request.contactPhone(),
            request.description()
        );

        Tenant tenant = tenantApplicationService.getTenant(id);
        TenantResponse response = TenantResponse.from(tenant);

        return ResponseEntity.ok(response);
    }

    /**
     * 激活租户（仅超级管理员）
     */
    @Operation(summary = "激活租户", description = "激活指定的租户（仅超级管理员）")
    @ApiResponse(responseCode = "204", description = "激活成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping("/tenants/{id}/activate")
    @PreAuthorize("hasAuthority('TENANT_ACTIVATE')")
    public ResponseEntity<Void> activateTenant(@PathVariable UUID id) {
        logger.info("Super admin activating tenant: {}", id);

        tenantApplicationService.activateTenant(id);

        return ResponseEntity.noContent().build();
    }

    /**
     * 停用租户（仅超级管理员）
     */
    @Operation(summary = "停用租户", description = "停用指定的租户（仅超级管理员）")
    @ApiResponse(responseCode = "204", description = "停用成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping("/tenants/{id}/deactivate")
    @PreAuthorize("hasAuthority('TENANT_DEACTIVATE')")
    public ResponseEntity<Void> deactivateTenant(@PathVariable UUID id) {
        logger.info("Super admin deactivating tenant: {}", id);

        tenantApplicationService.deactivateTenant(id);

        return ResponseEntity.noContent().build();
    }

    /**
     * 删除租户（软删除，仅超级管理员）
     */
    @Operation(summary = "删除租户", description = "软删除指定的租户（仅超级管理员）")
    @ApiResponse(responseCode = "204", description = "删除成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @DeleteMapping("/tenants/{id}")
    @PreAuthorize("hasAuthority('TENANT_DELETE')")
    public ResponseEntity<Void> deleteTenant(@PathVariable UUID id) {
        logger.info("Super admin deleting tenant: {}", id);

        tenantApplicationService.deleteTenant(id);

        return ResponseEntity.noContent().build();
    }
}

