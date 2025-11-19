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
 * 租户管理REST API
 * 提供租户查询和管理功能
 */
@RestController
@RequestMapping("/tenants")
@Tag(name = "租户管理", description = "租户查询和管理操作")
public class TenantController {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantController.class);
    
    private final TenantApplicationService tenantApplicationService;
    
    public TenantController(TenantApplicationService tenantApplicationService) {
        this.tenantApplicationService = tenantApplicationService;
    }
    
    /**
     * 创建租户（仅管理员）
     */
    @Operation(summary = "创建租户", description = "创建新的租户实例（仅管理员）")
    @ApiResponse(responseCode = "201", description = "创建成功")
    @ApiResponse(responseCode = "400", description = "请求参数错误")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping
    @PreAuthorize("hasAuthority('TENANT_CREATE')")
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody CreateTenantRequest request) {
        
        logger.info("Creating tenant with code: {}", request.code());
        
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
     * 获取租户详情（仅管理员）
     */
    @Operation(summary = "获取租户详情", description = "根据ID获取租户详细信息（仅管理员）")
    @ApiResponse(responseCode = "200", description = "成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('TENANT_VIEW')")
    public ResponseEntity<TenantResponse> getTenant(@PathVariable UUID id) {
        logger.debug("Getting tenant: {}", id);

        Tenant tenant = tenantApplicationService.getTenant(id);
        TenantResponse response = TenantResponse.from(tenant);

        return ResponseEntity.ok(response);
    }

    /**
     * 根据slug获取租户（公开接口，用于前端租户选择）
     *
     * 注意：此端点用于租户选择，无需认证即可访问。
     * 用户在登录前需要通过此端点获取租户信息，然后才能进行登录。
     *
     * 权限控制：公开端点，无@PreAuthorize注解，仅在SecurityConfig中配置permitAll()
     */
    @Operation(
        summary = "根据slug获取租户",
        description = "根据租户slug（代码）获取租户详细信息。此端点用于前端租户选择，无需认证即可访问。"
    )
    @ApiResponse(
        responseCode = "200",
        description = "成功获取租户信息",
        content = @Content(schema = @Schema(implementation = com.duanruo.exam.application.dto.TenantResponse.class))
    )
    @ApiResponse(
        responseCode = "404",
        description = "租户不存在",
        content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class))
    )
    @GetMapping("/slug/{slug}")
    public ResponseEntity<com.duanruo.exam.application.dto.TenantResponse> getTenantBySlug(
            @Parameter(description = "租户slug（代码）", example = "test-company-a", required = true)
            @PathVariable String slug
    ) {
        logger.debug("Getting tenant by slug: {}", slug);

        Tenant tenant = tenantApplicationService.getTenantBySlug(slug);
        com.duanruo.exam.application.dto.TenantResponse response =
                com.duanruo.exam.application.dto.TenantResponse.fromDomain(tenant);

        return ResponseEntity.ok(response);
    }
    
    /**
     * 列出所有租户（用于租户选择页面，所有已认证用户可访问）
     *
     * 注意：此端点用于登录后的租户选择页面，需要对所有已认证用户开放。
     * 用户登录后需要选择要访问的租户，因此不应限制为仅超级管理员可访问。
     */
    @Operation(
        summary = "获取租户列表",
        description = "获取所有激活状态的租户列表（用于租户选择页面）"
    )
    @ApiResponse(
        responseCode = "200",
        description = "成功获取租户列表",
        content = @Content(schema = @Schema(implementation = TenantListResponse.class))
    )
    @ApiResponse(
        responseCode = "401",
        description = "未认证"
    )
    @GetMapping
    // 移除权限限制，允许所有已认证用户访问（用于租户选择页面）
    public ResponseEntity<TenantListResponse> listTenants(
            @Parameter(description = "页码（从0开始）", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "仅显示激活的租户", example = "true")
            @RequestParam(required = false, defaultValue = "true") boolean activeOnly
    ) {
        logger.debug("Listing tenants (activeOnly: {}, page: {}, size: {})", activeOnly, page, size);

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

        return ResponseEntity.ok(response);
    }
    
    /**
     * 更新租户信息（仅管理员）
     */
    @Operation(summary = "更新租户信息", description = "更新租户的基本信息（仅管理员）")
    @ApiResponse(responseCode = "200", description = "更新成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('TENANT_UPDATE')")
    public ResponseEntity<TenantResponse> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequest request) {

        logger.info("Updating tenant: {}", id);

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
     * 激活租户（仅管理员）
     */
    @Operation(summary = "激活租户", description = "激活指定的租户（仅管理员）")
    @ApiResponse(responseCode = "200", description = "激活成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('TENANT_ACTIVATE')")
    public ResponseEntity<TenantResponse> activateTenant(@PathVariable UUID id) {
        logger.info("Activating tenant: {}", id);

        tenantApplicationService.activateTenant(id);

        // 返回更新后的租户信息
        Tenant tenant = tenantApplicationService.getTenant(id);
        TenantResponse response = TenantResponse.from(tenant);

        return ResponseEntity.ok(response);
    }

    /**
     * 停用租户（仅管理员）
     */
    @Operation(summary = "停用租户", description = "停用指定的租户（仅管理员）")
    @ApiResponse(responseCode = "200", description = "停用成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('TENANT_DEACTIVATE')")
    public ResponseEntity<TenantResponse> deactivateTenant(@PathVariable UUID id) {
        logger.info("Deactivating tenant: {}", id);

        tenantApplicationService.deactivateTenant(id);

        // 返回更新后的租户信息
        Tenant tenant = tenantApplicationService.getTenant(id);
        TenantResponse response = TenantResponse.from(tenant);

        return ResponseEntity.ok(response);
    }

    /**
     * 删除租户（软删除，仅管理员）
     */
    @Operation(summary = "删除租户", description = "软删除指定的租户（仅管理员）")
    @ApiResponse(responseCode = "204", description = "删除成功")
    @ApiResponse(responseCode = "404", description = "租户不存在")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('TENANT_DELETE')")
    public ResponseEntity<Void> deleteTenant(@PathVariable UUID id) {
        logger.info("Deleting tenant: {}", id);

        tenantApplicationService.deleteTenant(id);

        return ResponseEntity.noContent().build();
    }

    /**
     * 检查租户代码是否可用（仅管理员）
     */
    @Operation(summary = "检查租户代码", description = "检查租户代码是否可用（仅管理员）")
    @ApiResponse(responseCode = "200", description = "成功")
    @ApiResponse(responseCode = "403", description = "权限不足")
    @GetMapping("/check-code")
    @PreAuthorize("hasAuthority('TENANT_CREATE')")
    public ResponseEntity<Boolean> checkTenantCode(@RequestParam String code) {
        logger.debug("Checking tenant code availability: {}", code);

        boolean available = tenantApplicationService.isTenantCodeAvailable(code);

        return ResponseEntity.ok(available);
    }
}

