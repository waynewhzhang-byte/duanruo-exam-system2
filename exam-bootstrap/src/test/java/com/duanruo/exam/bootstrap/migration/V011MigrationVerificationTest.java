package com.duanruo.exam.bootstrap.migration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V011 迁移验证测试
 * 验证 scores 表已被删除，exam_scores 表存在
 */
@SpringBootTest
@ActiveProfiles("dev")
public class V011MigrationVerificationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void verifyV011Migration() throws Exception {
        System.out.println("\n=== V011 迁移验证测试 ===\n");

        // 1. 查询所有表
        System.out.println("1. 查询 tenant_test_company_a schema 中的所有表:");
        List<String> tables = new ArrayList<>();
        
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            
            // 设置 search_path
            jdbcTemplate.execute("SET search_path TO tenant_test_company_a, public");
            
            try (ResultSet rs = metaData.getTables(null, "tenant_test_company_a", "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    if (!tableName.equals("flyway_schema_history")) {
                        tables.add(tableName);
                    }
                }
            }
        }
        
        tables.sort(String::compareTo);
        for (int i = 0; i < tables.size(); i++) {
            System.out.println("   " + (i + 1) + ". " + tables.get(i));
        }
        System.out.println("   总计: " + tables.size() + " 个业务表\n");

        // 2. 验证 scores 表不存在
        System.out.println("2. 验证 scores 表已被删除:");
        boolean scoresExists = tables.contains("scores");
        if (scoresExists) {
            System.out.println("   ❌ scores 表仍然存在（迁移失败）");
        } else {
            System.out.println("   ✓ scores 表已被删除（迁移成功）");
        }
        assertThat(scoresExists).isFalse();
        System.out.println();

        // 3. 验证 exam_scores 表存在
        System.out.println("3. 验证 exam_scores 表存在:");
        boolean examScoresExists = tables.contains("exam_scores");
        if (examScoresExists) {
            System.out.println("   ✓ exam_scores 表存在");
        } else {
            System.out.println("   ❌ exam_scores 表不存在");
        }
        assertThat(examScoresExists).isTrue();
        System.out.println();

        // 4. 验证表数量
        System.out.println("4. 验证表数量:");
        System.out.println("   期望: 18 个业务表（19 - 1 删除的 scores 表）");
        System.out.println("   实际: " + tables.size() + " 个业务表");
        assertThat(tables.size()).isEqualTo(18);
        System.out.println("   ✓ 表数量正确\n");

        // 5. 查看最近的迁移记录
        System.out.println("5. 最近的 Flyway 迁移记录:");
        jdbcTemplate.execute("SET search_path TO tenant_test_company_a, public");
        
        List<String> migrations = jdbcTemplate.query(
            "SELECT version, description, installed_on, success " +
            "FROM flyway_schema_history " +
            "ORDER BY installed_rank DESC LIMIT 5",
            (rs, rowNum) -> String.format("   V%s - %s (成功: %s, 时间: %s)",
                rs.getString("version"),
                rs.getString("description"),
                rs.getBoolean("success") ? "✓" : "✗",
                rs.getTimestamp("installed_on"))
        );
        
        migrations.forEach(System.out::println);
        System.out.println();

        System.out.println("=== ✓ V011 迁移验证通过 ===\n");
    }
}

