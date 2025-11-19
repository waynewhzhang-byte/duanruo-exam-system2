package com.duanruo.exam.infrastructure.multitenancy;

import com.duanruo.exam.domain.tenant.Tenant;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.List;

/**
 * Schema管理服务
 * 负责创建、初始化和删除租户Schema
 */
@Service
public class SchemaManagementService {
    
    private static final Logger logger = LoggerFactory.getLogger(SchemaManagementService.class);
    
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    
    public SchemaManagementService(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }
    
    /**
     * 为租户创建Schema
     */
    @Transactional
    public void createSchemaForTenant(Tenant tenant) {
        String schemaName = tenant.getSchemaName();
        
        logger.info("Creating schema for tenant: {} ({})", tenant.getName(), schemaName);
        
        try {
            // 1. 创建Schema
            // PostgreSQL Schema名称如果包含特殊字符（如连字符），需要使用双引号包裹
            String quotedSchemaName = "\"" + schemaName + "\"";
            String createSchemaSql = String.format("CREATE SCHEMA IF NOT EXISTS %s", quotedSchemaName);
            jdbcTemplate.execute(createSchemaSql);
            logger.info("Schema created: {}", schemaName);
            
            // 2. 设置Schema搜索路径
            String setSearchPathSql = String.format("SET search_path TO %s, public", quotedSchemaName);
            jdbcTemplate.execute(setSearchPathSql);
            
            // 3. 在新Schema中创建所有业务表
            createBusinessTables(schemaName);
            
            logger.info("Schema initialized successfully for tenant: {}", tenant.getName());
            
        } catch (Exception e) {
            logger.error("Failed to create schema for tenant: {}", tenant.getName(), e);
            throw new SchemaCreationException("Failed to create schema: " + schemaName, e);
        }
    }
    
    /**
     * 在指定Schema中创建业务表
     */
    private void createBusinessTables(String schemaName) {
        logger.info("Creating business tables in schema: {}", schemaName);

        try {
            // 使用Flyway在指定Schema中执行迁移（仅加载租户专用迁移目录）
            logger.info("Configuring Flyway for schema: {}", schemaName);
            logger.info("  Migration locations: classpath:db/tenant-migration");
            logger.info("  Baseline on migrate: true");
            
            Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations("classpath:db/tenant-migration")
                .baselineOnMigrate(true)
                .validateOnMigrate(false) // 允许迁移脚本有变化
                .load();

            logger.info("Running Flyway migration for schema: {}", schemaName);
            int migrationsApplied = flyway.migrate().migrationsExecuted;
            
            logger.info("Flyway migration completed: {} migrations applied", migrationsApplied);
            
            // 验证表是否创建成功
            List<String> tables = getTablesInSchema(schemaName);
            logger.info("Business tables created in schema: {} ({} tables)", schemaName, tables.size());
            
            if (tables.isEmpty()) {
                logger.warn("WARNING: Schema {} was created but no tables were found after migration", schemaName);
            } else {
                logger.info("Created tables: {}", tables);
            }
            
        } catch (Exception e) {
            logger.error("Failed to create business tables in schema: {}", schemaName, e);
            throw new SchemaCreationException("Failed to create business tables in schema: " + schemaName, e);
        }
    }

    /**
     * 为现有租户Schema执行迁移
     * 用于在添加新的migration脚本后更新现有租户的Schema
     */
    public void migrateExistingSchema(String schemaName) {
        logger.info("Migrating existing schema: {}", schemaName);

        try {
            // 检查Schema是否存在
            if (!schemaExists(schemaName)) {
                logger.warn("Schema does not exist: {}", schemaName);
                return;
            }

            // 使用Flyway执行迁移
            Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations("classpath:db/tenant-migration")
                .baselineOnMigrate(true)
                .load();

            flyway.migrate();

            logger.info("Schema migration completed: {}", schemaName);

        } catch (Exception e) {
            logger.error("Failed to migrate schema: {}", schemaName, e);
            throw new RuntimeException("Failed to migrate schema: " + schemaName, e);
        }
    }

    /**
     * 为所有现有租户执行迁移
     */
    public void migrateAllExistingSchemas(List<String> schemaNames) {
        logger.info("Migrating all existing schemas: {}", schemaNames);

        for (String schemaName : schemaNames) {
            try {
                migrateExistingSchema(schemaName);
            } catch (Exception e) {
                logger.error("Failed to migrate schema: {}, continuing with next schema", schemaName, e);
            }
        }

        logger.info("All schema migrations completed");
    }
    
    /**
     * 删除租户Schema
     */
    @Transactional
    public void dropSchemaForTenant(Tenant tenant) {
        String schemaName = tenant.getSchemaName();
        
        logger.warn("Dropping schema for tenant: {} ({})", tenant.getName(), schemaName);
        
        try {
            // 删除Schema及其所有对象
            // PostgreSQL Schema名称如果包含特殊字符（如连字符），需要使用双引号包裹
            String quotedSchemaName = "\"" + schemaName + "\"";
            String dropSchemaSql = String.format("DROP SCHEMA IF EXISTS %s CASCADE", quotedSchemaName);
            jdbcTemplate.execute(dropSchemaSql);
            
            logger.info("Schema dropped: {}", schemaName);
            
        } catch (Exception e) {
            logger.error("Failed to drop schema for tenant: {}", tenant.getName(), e);
            throw new SchemaDropException("Failed to drop schema: " + schemaName, e);
        }
    }
    
    /**
     * 检查Schema是否存在
     */
    public boolean schemaExists(String schemaName) {
        String sql = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = ?)";
        Boolean exists = jdbcTemplate.queryForObject(sql, Boolean.class, schemaName);
        return Boolean.TRUE.equals(exists);
    }
    
    /**
     * 获取Schema中的表列表
     */
    public List<String> getTablesInSchema(String schemaName) {
        String sql = "SELECT table_name FROM information_schema.tables " +
                    "WHERE table_schema = ? AND table_type = 'BASE TABLE' " +
                    "ORDER BY table_name";
        return jdbcTemplate.queryForList(sql, String.class, schemaName);
    }
    
    /**
     * 获取Schema的大小（估算）
     */
    public Long getSchemaSize(String schemaName) {
        String sql = "SELECT pg_size_pretty(SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint)::text " +
                    "FROM pg_tables WHERE schemaname = ?";
        try {
            return jdbcTemplate.queryForObject(sql, Long.class, schemaName);
        } catch (Exception e) {
            logger.warn("Failed to get schema size for: {}", schemaName, e);
            return 0L;
        }
    }
    
    /**
     * 验证Schema结构
     */
    public boolean validateSchemaStructure(String schemaName) {
        try {
            List<String> tables = getTablesInSchema(schemaName);
            
            // 检查必需的表是否存在
            String[] requiredTables = {
                "exams", "positions", "subjects", "applications", 
                "tickets", "reviews", "scores", "files"
            };
            
            for (String requiredTable : requiredTables) {
                if (!tables.contains(requiredTable)) {
                    logger.warn("Required table '{}' not found in schema: {}", requiredTable, schemaName);
                    return false;
                }
            }
            
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to validate schema structure: {}", schemaName, e);
            return false;
        }
    }
    
    // 异常类
    public static class SchemaCreationException extends RuntimeException {
        public SchemaCreationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    public static class SchemaDropException extends RuntimeException {
        public SchemaDropException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

