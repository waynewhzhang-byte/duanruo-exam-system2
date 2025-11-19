package com.duanruo.exam.infrastructure.multitenancy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 租户Schema迁移初始化器
 * 在应用启动时为所有现有租户执行Schema迁移
 */
@Component
public class TenantSchemaMigrationInitializer implements ApplicationRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantSchemaMigrationInitializer.class);
    
    private final SchemaManagementService schemaManagementService;
    private final JdbcTemplate jdbcTemplate;
    
    public TenantSchemaMigrationInitializer(
            SchemaManagementService schemaManagementService,
            JdbcTemplate jdbcTemplate) {
        this.schemaManagementService = schemaManagementService;
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @Override
    public void run(ApplicationArguments args) {
        logger.info("Starting tenant schema migration initialization...");
        
        try {
            // 获取所有租户的schema名称
            List<String> schemaNames = getAllTenantSchemas();
            
            if (schemaNames.isEmpty()) {
                logger.info("No tenant schemas found, skipping migration");
                return;
            }
            
            logger.info("Found {} tenant schema(s): {}", schemaNames.size(), schemaNames);
            
            // 为所有租户执行迁移
            schemaManagementService.migrateAllExistingSchemas(schemaNames);
            
            logger.info("Tenant schema migration initialization completed successfully");
            
        } catch (Exception e) {
            logger.error("Failed to initialize tenant schema migrations", e);
            // 不抛出异常，允许应用继续启动
        }
    }
    
    /**
     * 获取所有租户的schema名称
     */
    private List<String> getAllTenantSchemas() {
        String sql = "SELECT schema_name FROM public.tenants WHERE status = 'ACTIVE'";
        return jdbcTemplate.queryForList(sql, String.class);
    }
}

