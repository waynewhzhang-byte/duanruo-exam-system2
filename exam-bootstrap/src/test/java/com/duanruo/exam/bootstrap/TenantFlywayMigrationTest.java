package com.duanruo.exam.bootstrap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

/**
 * Run Flyway tenant migrations (db/tenant-migration) for all ACTIVE tenants.
 * Pure JUnit (no Spring context). Safe-by-default verification migration.
 */
public class TenantFlywayMigrationTest {

    private DataSource buildDataSource() {
        String url = System.getenv().getOrDefault("DATABASE_URL",
                System.getProperty("DATABASE_URL", "jdbc:postgresql://localhost:5432/duanruo-exam-system"));
        String username = System.getenv().getOrDefault("DATABASE_USERNAME",
                System.getProperty("DATABASE_USERNAME", "postgres"));
        String password = System.getenv().getOrDefault("DATABASE_PASSWORD",
                System.getProperty("DATABASE_PASSWORD", "zww0625wh"));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setPoolName("tenant-flyway-test-pool");
        return new HikariDataSource(config);
    }

    private String resolveTenantMigrationLocation() {
        String userDir = System.getProperty("user.dir");
        Path path = Paths.get(userDir)
                .resolve("..")
                .resolve("exam-infrastructure")
                .resolve("src/main/resources/db/tenant-migration")
                .normalize();
        if (Files.isDirectory(path)) {
            return "filesystem:" + path.toAbsolutePath();
        }
        return "classpath:db/tenant-migration";
    }

    private List<String> findActiveTenantSchemas(DataSource ds) throws Exception {
        String sql = "SELECT schema_name FROM public.tenants WHERE status = 'ACTIVE' AND schema_name LIKE 'tenant_%'";
        List<String> schemas = new ArrayList<>();
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                schemas.add(rs.getString(1));
            }
        }
        return schemas;
    }

    private boolean schemaHistoryExists(DataSource ds, String schema) throws Exception {
        String sql = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'flyway_schema_history')";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getBoolean(1);
            }
        }
        return false;
    }

    private boolean tableExists(DataSource ds, String schema, String table) throws Exception {
        String sql = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?)";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, schema);
            ps.setString(2, table);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getBoolean(1);
            }
        }
        return false;
    }

    @Test
    public void migrateAllActiveTenantSchemas() throws Exception {
        try (HikariDataSource ds = (HikariDataSource) buildDataSource()) {
            String location = resolveTenantMigrationLocation();
            List<String> schemas = findActiveTenantSchemas(ds);
            System.out.println("Found active tenant schemas: " + schemas);

            for (String schema : schemas) {
                System.out.println("Migrating tenant schema: " + schema);

                boolean hasHistory = schemaHistoryExists(ds, schema);
                boolean hasCoreTables = tableExists(ds, schema, "exams");

                Flyway flyway;
                if (!hasHistory && hasCoreTables) {
                    // Legacy tenant schema: skip earlier tenant migrations V001-V003, apply from V004
                    flyway = Flyway.configure()
                            .dataSource(ds)
                            .schemas(schema)
                            .locations(location)
                            .baselineOnMigrate(true)
                            .baselineVersion("003")
                            .validateOnMigrate(true)
                            .cleanDisabled(true)
                            .load();
                    System.out.println("Baseline legacy tenant schema at version 003, then migrate -> " + schema);
                } else {
                    // Normal path
                    flyway = Flyway.configure()
                            .dataSource(ds)
                            .schemas(schema)
                            .locations(location)
                            .baselineOnMigrate(true)
                            .validateOnMigrate(true)
                            .cleanDisabled(true)
                            .load();
                }

                flyway.migrate();
            }
        }
        System.out.println("Tenant Flyway migration completed successfully!");
    }
}

