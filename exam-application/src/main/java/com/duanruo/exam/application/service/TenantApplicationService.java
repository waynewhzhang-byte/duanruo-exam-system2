package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantCreatedEvent;
import com.duanruo.exam.domain.tenant.TenantRepository;
import com.duanruo.exam.shared.domain.TenantId;
import com.duanruo.exam.shared.exception.ApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * 租户应用服务
 * 处理租户相关的业务逻辑
 */
@Service
public class TenantApplicationService {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantApplicationService.class);

    private final TenantRepository tenantRepository;
    private final ApplicationEventPublisher eventPublisher;

    public TenantApplicationService(
            TenantRepository tenantRepository,
            ApplicationEventPublisher eventPublisher) {
        this.tenantRepository = tenantRepository;
        this.eventPublisher = eventPublisher;
    }
    
    /**
     * 创建新租户
     */
    @Transactional
    public TenantId createTenant(
            String name,
            String code,
            String contactEmail,
            String contactPhone,
            String description) {
        
        logger.info("Creating new tenant with code: {}", code);
        
        // 检查租户代码是否已存在
        if (tenantRepository.existsByCode(code)) {
            throw new TenantAlreadyExistsException("Tenant with code '" + code + "' already exists");
        }
        
        // 创建租户
        TenantId tenantId = TenantId.generate();
        Tenant tenant = Tenant.create(
            tenantId,
            name,
            code,
            contactEmail,
            contactPhone,
            description
        );
        
        // 保存租户
        tenantRepository.save(tenant);

        // 发布租户创建事件（用于异步创建Schema）
        TenantCreatedEvent event = new TenantCreatedEvent(
            tenantId,
            name,
            code,
            tenant.getSchemaName(),
            tenant.getCreatedAt()
        );
        eventPublisher.publishEvent(event);

        logger.info("Tenant created successfully: {} ({})", name, tenantId);

        return tenantId;
    }
    
    /**
     * 激活租户
     */
    @Transactional
    public void activateTenant(UUID tenantId) {
        logger.info("Activating tenant: {}", tenantId);
        
        Tenant tenant = tenantRepository.findById(TenantId.of(tenantId))
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantId));
        
        tenant.activate();
        tenantRepository.save(tenant);
        
        logger.info("Tenant activated successfully: {}", tenantId);
    }
    
    /**
     * 停用租户
     */
    @Transactional
    public void deactivateTenant(UUID tenantId) {
        logger.info("Deactivating tenant: {}", tenantId);
        
        Tenant tenant = tenantRepository.findById(TenantId.of(tenantId))
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantId));
        
        tenant.deactivate();
        tenantRepository.save(tenant);
        
        logger.info("Tenant deactivated successfully: {}", tenantId);
    }
    
    /**
     * 更新租户信息
     */
    @Transactional
    public void updateTenant(
            UUID tenantId,
            String name,
            String contactEmail,
            String contactPhone,
            String description) {
        
        logger.info("Updating tenant: {}", tenantId);
        
        Tenant tenant = tenantRepository.findById(TenantId.of(tenantId))
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantId));
        
        tenant.updateInfo(name, contactEmail, contactPhone, description);
        tenantRepository.save(tenant);
        
        logger.info("Tenant updated successfully: {}", tenantId);
    }
    
    /**
     * 删除租户（软删除）
     */
    @Transactional
    public void deleteTenant(UUID tenantId) {
        logger.info("Deleting tenant: {}", tenantId);
        
        Tenant tenant = tenantRepository.findById(TenantId.of(tenantId))
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantId));
        
        tenant.delete();
        tenantRepository.save(tenant);
        
        logger.info("Tenant deleted successfully: {}", tenantId);
    }
    
    /**
     * 获取租户详情
     */
    @Transactional(readOnly = true)
    public Tenant getTenant(UUID tenantId) {
        return tenantRepository.findById(TenantId.of(tenantId))
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantId));
    }
    
    /**
     * 根据代码获取租户
     */
    @Transactional(readOnly = true)
    public Tenant getTenantByCode(String code) {
        return tenantRepository.findByCode(code)
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found with code: " + code));
    }

    /**
     * 根据slug获取租户（slug就是code）
     */
    @Transactional(readOnly = true)
    public Tenant getTenantBySlug(String slug) {
        return getTenantByCode(slug);
    }
    
    /**
     * 列出所有激活的租户
     */
    @Transactional(readOnly = true)
    public List<Tenant> listActiveTenants() {
        return tenantRepository.findAllActive();
    }
    
    /**
     * 列出所有租户
     */
    @Transactional(readOnly = true)
    public List<Tenant> listAllTenants() {
        return tenantRepository.findAll();
    }
    
    /**
     * 检查租户代码是否可用
     */
    @Transactional(readOnly = true)
    public boolean isTenantCodeAvailable(String code) {
        return !tenantRepository.existsByCode(code);
    }
    
    // 异常类
    public static class TenantNotFoundException extends ApplicationException {
        public TenantNotFoundException(String message) {
            super(message);
        }
    }
    
    public static class TenantAlreadyExistsException extends ApplicationException {
        public TenantAlreadyExistsException(String message) {
            super(message);
        }
    }
}

