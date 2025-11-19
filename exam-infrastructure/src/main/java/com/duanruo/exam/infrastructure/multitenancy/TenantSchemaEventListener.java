package com.duanruo.exam.infrastructure.multitenancy;

import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantCreatedEvent;
import com.duanruo.exam.domain.tenant.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 租户Schema事件监听器
 * 监听租户创建事件，自动创建Schema
 */
@Component
public class TenantSchemaEventListener {

    private static final Logger logger = LoggerFactory.getLogger(TenantSchemaEventListener.class);

    private final SchemaManagementService schemaManagementService;
    private final TenantRepository tenantRepository;

    public TenantSchemaEventListener(
            SchemaManagementService schemaManagementService,
            TenantRepository tenantRepository) {
        this.schemaManagementService = schemaManagementService;
        this.tenantRepository = tenantRepository;
    }

    /**
     * 监听租户创建事件，在事务提交后创建Schema
     *
     * 注意：使用 @TransactionalEventListener 确保在事务提交后执行
     * 改为同步执行，确保Schema创建成功后才返回
     *
     * 重要：Schema创建是关键操作，如果失败会记录详细错误日志
     * 建议监控日志中的错误，必要时可以手动触发Schema创建
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTenantCreated(TenantCreatedEvent event) {
        String tenantId = event.getTenantId().toString();
        String tenantName = event.getTenantName();
        String schemaName = event.getSchemaName();
        
        logger.info("========================================");
        logger.info("Handling tenant created event");
        logger.info("  Tenant ID: {}", tenantId);
        logger.info("  Tenant Name: {}", tenantName);
        logger.info("  Schema Name: {}", schemaName);
        logger.info("========================================");
        
        try {
            // 查找租户
            logger.info("Step 1: Looking up tenant in database...");
            Tenant tenant = tenantRepository.findById(event.getTenantId())
                .orElseThrow(() -> {
                    logger.error("CRITICAL: Tenant not found in database: tenantId={}", tenantId);
                    return new IllegalStateException("Tenant not found: " + tenantId);
                });
            
            logger.info("✓ Tenant found: tenantId={}, schemaName={}", 
                tenant.getId(), tenant.getSchemaName());
            
            // 检查Schema是否已存在
            logger.info("Step 2: Checking if schema already exists...");
            if (schemaManagementService.schemaExists(tenant.getSchemaName())) {
                logger.warn("Schema already exists: {}, checking if tables exist...", tenant.getSchemaName());
                
                // 检查Schema中是否有表
                var tables = schemaManagementService.getTablesInSchema(tenant.getSchemaName());
                if (tables.isEmpty()) {
                    logger.warn("Schema exists but has no tables, running migration...");
                    // Schema存在但没有表，运行迁移
                    schemaManagementService.migrateExistingSchema(tenant.getSchemaName());
                    logger.info("✓ Migration completed for existing schema: {}", tenant.getSchemaName());
                } else {
                    logger.info("✓ Schema already exists with {} tables, skipping creation", tables.size());
                }
                return;
            }
            
            // 创建Schema和业务表
            logger.info("Step 3: Creating schema and business tables...");
            logger.info("Starting schema creation for tenant: {} (schema: {})", 
                tenant.getName(), tenant.getSchemaName());
            
            schemaManagementService.createSchemaForTenant(tenant);
            
            // 验证Schema创建成功
            logger.info("Step 4: Verifying schema creation...");
            if (!schemaManagementService.schemaExists(tenant.getSchemaName())) {
                throw new IllegalStateException("Schema was not created: " + tenant.getSchemaName());
            }
            
            var tables = schemaManagementService.getTablesInSchema(tenant.getSchemaName());
            logger.info("✓ Schema created successfully with {} tables", tables.size());
            logger.info("Schema tables: {}", tables);
            
            logger.info("========================================");
            logger.info("Schema creation completed successfully");
            logger.info("  Tenant: {} ({})", tenantName, tenantId);
            logger.info("  Schema: {}", schemaName);
            logger.info("  Tables: {}", tables.size());
            logger.info("========================================");
            
        } catch (Exception e) {
            logger.error("========================================");
            logger.error("CRITICAL ERROR: Failed to create schema for tenant");
            logger.error("  Tenant ID: {}", tenantId);
            logger.error("  Tenant Name: {}", tenantName);
            logger.error("  Schema Name: {}", schemaName);
            logger.error("  Error: {}", e.getMessage(), e);
            logger.error("========================================");
            
            // 打印完整的堆栈跟踪
            logger.error("Full stack trace:", e);
            
            // 注意：这里不抛出异常，因为是异步处理
            // 但错误会被详细记录，便于排查和监控
            // TODO: 可以考虑发送告警通知或记录到错误表
        }
    }
}

