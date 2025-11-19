package com.duanruo.exam.infrastructure.multitenancy;

import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * 租户Schema连接提供者
 * 为每个租户提供配置了正确search_path的数据库连接
 */
@Component
public class TenantSchemaConnectionProvider implements MultiTenantConnectionProvider {

    private static final Logger logger = LoggerFactory.getLogger(TenantSchemaConnectionProvider.class);
    private static final String DEFAULT_SCHEMA = "public";

    private final DataSource dataSource;

    public TenantSchemaConnectionProvider(DataSource dataSource) {
        this.dataSource = dataSource;
    }
    
    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }
    
    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        connection.close();
    }
    
    @Override
    public Connection getConnection(Object tenantIdentifier) throws SQLException {
        Connection connection = getAnyConnection();

        try {
            String schemaName = resolveSchemaName(tenantIdentifier.toString());

            // 设置search_path到租户Schema
            String sql = String.format("SET search_path TO %s, public", schemaName);
            connection.createStatement().execute(sql);

            logger.debug("Set search_path to: {} for tenant: {}", schemaName, tenantIdentifier);

        } catch (SQLException e) {
            logger.error("Failed to set search_path for tenant: {}", tenantIdentifier, e);
            releaseAnyConnection(connection);
            throw e;
        }

        return connection;
    }

    @Override
    public void releaseConnection(Object tenantIdentifier, Connection connection) throws SQLException {
        try {
            // 重置search_path到默认值
            connection.createStatement().execute("SET search_path TO public");
        } catch (SQLException e) {
            logger.warn("Failed to reset search_path", e);
        } finally {
            releaseAnyConnection(connection);
        }
    }
    
    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }
    
    @Override
    public boolean isUnwrappableAs(Class unwrapType) {
        return false;
    }
    
    @Override
    public <T> T unwrap(Class<T> unwrapType) {
        return null;
    }
    
    /**
     * 解析租户标识符到Schema名称
     * 直接从数据库查询，避免循环依赖
     */
    private String resolveSchemaName(String tenantIdentifier) {
        if (tenantIdentifier == null || tenantIdentifier.equals(DEFAULT_SCHEMA)) {
            return DEFAULT_SCHEMA;
        }

        try (Connection connection = dataSource.getConnection()) {
            // 明确指定 public.tenants，避免 search_path 影响
            String sql = "SELECT schema_name FROM public.tenants WHERE id = ?::uuid";
            try (var stmt = connection.prepareStatement(sql)) {
                stmt.setString(1, tenantIdentifier);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        String schemaName = rs.getString("schema_name");
                        logger.debug("Resolved schema name: {} for tenant: {}", schemaName, tenantIdentifier);
                        return schemaName;
                    }
                }
            }

            logger.warn("Tenant not found: {}, using default schema", tenantIdentifier);
            return DEFAULT_SCHEMA;

        } catch (Exception e) {
            logger.error("Failed to resolve schema name for tenant: {}", tenantIdentifier, e);
            return DEFAULT_SCHEMA;
        }
    }
}

