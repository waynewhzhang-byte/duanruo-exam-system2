package com.duanruo.exam.application.dto;

import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 租户响应DTO
 */
@Schema(description = "租户信息")
public class TenantResponse {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    @Schema(description = "租户ID", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @Schema(description = "租户名称", example = "2024年公务员考试")
    private String name;
    
    @Schema(description = "租户代码（slug）", example = "2024-civil-service")
    private String slug;
    
    @Schema(description = "租户描述", example = "2024年度国家公务员考试")
    private String description;
    
    @Schema(description = "租户状态", example = "ACTIVE", allowableValues = {"PENDING", "ACTIVE", "INACTIVE", "DELETED"})
    private String status;
    
    @Schema(description = "联系邮箱", example = "contact@example.com")
    private String contactEmail;
    
    @Schema(description = "联系电话", example = "13800138000")
    private String contactPhone;
    
    @Schema(description = "创建时间", example = "2024-01-01 10:00:00")
    private String createdAt;
    
    @Schema(description = "更新时间", example = "2024-01-01 10:00:00")
    private String updatedAt;
    
    @Schema(description = "激活时间", example = "2024-01-01 10:00:00")
    private String activatedAt;
    
    @Schema(description = "停用时间", example = "2024-01-01 10:00:00")
    private String deactivatedAt;
    
    // 构造函数
    public TenantResponse() {
    }
    
    /**
     * 从领域对象创建DTO
     */
    public static TenantResponse fromDomain(Tenant tenant) {
        TenantResponse response = new TenantResponse();
        response.id = tenant.getId().getValue();
        response.name = tenant.getName();
        response.slug = tenant.getCode(); // code作为slug
        response.description = tenant.getDescription();
        response.status = mapStatus(tenant.getStatus());
        response.contactEmail = tenant.getContactEmail();
        response.contactPhone = tenant.getContactPhone();
        response.createdAt = formatDateTime(tenant.getCreatedAt());
        response.updatedAt = formatDateTime(tenant.getUpdatedAt());
        response.activatedAt = formatDateTime(tenant.getActivatedAt());
        response.deactivatedAt = formatDateTime(tenant.getDeactivatedAt());
        return response;
    }
    
    /**
     * 映射状态到前端期望的格式
     */
    private static String mapStatus(TenantStatus status) {
        if (status == null) {
            return "INACTIVE";
        }
        switch (status) {
            case ACTIVE:
                return "ACTIVE";
            case PENDING:
            case INACTIVE:
                return "INACTIVE";
            case DELETED:
                return "SUSPENDED"; // 已删除映射为暂停
            default:
                return "INACTIVE";
        }
    }
    
    /**
     * 格式化日期时间
     */
    private static String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(FORMATTER) : null;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getSlug() {
        return slug;
    }
    
    public void setSlug(String slug) {
        this.slug = slug;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getContactEmail() {
        return contactEmail;
    }
    
    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
    
    public String getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getActivatedAt() {
        return activatedAt;
    }
    
    public void setActivatedAt(String activatedAt) {
        this.activatedAt = activatedAt;
    }
    
    public String getDeactivatedAt() {
        return deactivatedAt;
    }
    
    public void setDeactivatedAt(String deactivatedAt) {
        this.deactivatedAt = deactivatedAt;
    }
}

