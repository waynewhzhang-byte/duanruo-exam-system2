package com.duanruo.exam.bootstrap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Flyway 迁移测试（不加载Spring上下文）
 */
public class FlywayMigrationTest {

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
        config.setPoolName("flyway-test-pool");
        return new HikariDataSource(config);
    }

    private String resolveMigrationLocation() {
        // 尝试使用源码目录，避免依赖旧版 JAR 中的 tenant 目录
        String userDir = System.getProperty("user.dir");
        Path infraPath = Paths.get(userDir)
                .resolve("..")
                .resolve("exam-infrastructure")
                .resolve("src/main/resources/db/migration")
                .normalize();
        if (Files.isDirectory(infraPath)) {
            return "filesystem:" + infraPath.toAbsolutePath();
        }
        // 回退到 classpath（可能会因旧 JAR 包含 tenant/ 目录而报重复版本）
        return "classpath:db/migration";
    }

    @Test
    public void testFlywayMigration() {
        try (HikariDataSource ds = (HikariDataSource) buildDataSource()) {
            String location = resolveMigrationLocation();
            Flyway flyway = Flyway.configure()
                    .dataSource(ds)
                    .locations(location)
                    .baselineOnMigrate(true)
                    .validateOnMigrate(true)
                    .cleanDisabled(true)
                    .ignoreMigrationPatterns("*:ignored")
                    .load();

            flyway.migrate();
        }
        System.out.println("Flyway migration completed successfully!");
    }
}
