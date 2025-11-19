package com.duanruo.exam.bootstrap.integration;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * 测试租户辅助类
 * 
 * 负责在集成测试中创建和管理租户Schema
 * 确保测试数据库架构与生产环境完全一致
 */
@Component
public class TestTenantHelper {

    private static final Logger logger = LoggerFactory.getLogger(TestTenantHelper.class);
    
    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    
    // 记录测试中创建的Schema，用于清理
    private final Set<String> createdSchemas = new HashSet<>();

    public TestTenantHelper(DataSource dataSource) {
        this.dataSource = dataSource;
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    /**
     * 创建测试租户并返回租户ID
     * 
     * @param tenantCode 租户代码
     * @param tenantName 租户名称
     * @return 租户ID
     */
    public UUID createTestTenant(String tenantCode, String tenantName) {
        String schemaName = "tenant_" + tenantCode;
        
        logger.info("Creating test tenant: {} (schema: {})", tenantName, schemaName);
        
        // 1. 在public.tenants表中插入租户记录
        UUID tenantId = UUID.randomUUID();
        String insertTenantSql = """
            INSERT INTO tenants (id, name, code, schema_name, status, contact_email, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'ACTIVE', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """;
        
        jdbcTemplate.update(insertTenantSql, 
            tenantId, 
            tenantName, 
            tenantCode, 
            schemaName, 
            "test@" + tenantCode + ".com"
        );
        
        // 2. 创建租户Schema
        createTenantSchema(schemaName);
        
        // 3. 记录创建的Schema（用于清理）
        createdSchemas.add(schemaName);
        
        logger.info("Test tenant created successfully: {} (ID: {})", tenantName, tenantId);
        
        return tenantId;
    }

    /**
     * 创建租户Schema并执行Flyway迁移
     * 
     * @param schemaName Schema名称
     */
    private void createTenantSchema(String schemaName) {
        logger.info("Creating tenant schema: {}", schemaName);
        
        try {
            // 1. 创建Schema
            String createSchemaSql = String.format("CREATE SCHEMA IF NOT EXISTS %s", schemaName);
            jdbcTemplate.execute(createSchemaSql);
            logger.info("Schema created: {}", schemaName);
            
            // 2. 在新Schema中执行租户迁移脚本
            Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations("classpath:db/tenant-migration")
                .baselineOnMigrate(true)
                .validateOnMigrate(true)
                .cleanDisabled(false)  // 测试环境允许clean
                .load();
            
            flyway.migrate();
            
            logger.info("Tenant schema initialized successfully: {}", schemaName);
            
        } catch (Exception e) {
            logger.error("Failed to create tenant schema: {}", schemaName, e);
            throw new RuntimeException("Failed to create tenant schema: " + schemaName, e);
        }
    }

    /**
     * 删除测试租户Schema
     * 
     * @param schemaName Schema名称
     */
    public void dropTenantSchema(String schemaName) {
        logger.info("Dropping tenant schema: {}", schemaName);
        
        try {
            String dropSchemaSql = String.format("DROP SCHEMA IF EXISTS %s CASCADE", schemaName);
            jdbcTemplate.execute(dropSchemaSql);
            createdSchemas.remove(schemaName);
            logger.info("Schema dropped: {}", schemaName);
        } catch (Exception e) {
            logger.error("Failed to drop schema: {}", schemaName, e);
        }
    }

    /**
     * 清理所有测试创建的Schema
     */
    public void cleanupAllTestSchemas() {
        logger.info("Cleaning up all test schemas...");
        
        for (String schemaName : new HashSet<>(createdSchemas)) {
            dropTenantSchema(schemaName);
        }
        
        logger.info("All test schemas cleaned up");
    }

    /**
     * 检查Schema是否存在
     * 
     * @param schemaName Schema名称
     * @return true if exists
     */
    public boolean schemaExists(String schemaName) {
        String sql = "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, schemaName);
        return count != null && count > 0;
    }

    /**
     * 获取租户的Schema名称
     * 
     * @param tenantId 租户ID
     * @return Schema名称
     */
    public String getTenantSchemaName(UUID tenantId) {
        String sql = "SELECT schema_name FROM tenants WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, String.class, tenantId);
    }
}

