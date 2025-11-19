package com.duanruo.exam.bootstrap.integration;

import com.duanruo.exam.domain.tenant.TenantBackupExecutor;
import com.duanruo.exam.domain.tenant.TenantRestoreExecutor;
import com.duanruo.exam.shared.domain.TenantId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 租户备份和恢复基础功能测试
 */
@SpringBootTest
@ActiveProfiles("test")
public class TenantBackupBasicTest {

    @Autowired
    private TenantBackupExecutor backupExecutor;

    @Autowired
    private TenantRestoreExecutor restoreExecutor;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void testBackupExecutorExists() {
        assertNotNull(backupExecutor, "TenantBackupExecutor should be autowired");
    }

    @Test
    public void testRestoreExecutorExists() {
        assertNotNull(restoreExecutor, "TenantRestoreExecutor should be autowired");
    }

    @Test
    public void testBackupAndRestoreBasicFlow() {
        // 1. 创建测试租户Schema
        String testSchemaName = "tenant_backup_test_" + System.currentTimeMillis();
        TenantId testTenantId = TenantId.of(UUID.randomUUID());
        
        try {
            // 创建Schema
            jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + testSchemaName);
            
            // 创建一个简单的测试表
            jdbcTemplate.execute(String.format(
                "CREATE TABLE %s.test_table (id SERIAL PRIMARY KEY, name VARCHAR(100))", 
                testSchemaName
            ));
            
            // 插入测试数据
            jdbcTemplate.execute(String.format(
                "INSERT INTO %s.test_table (name) VALUES ('test1'), ('test2'), ('test3')", 
                testSchemaName
            ));
            
            // 2. 执行备份
            TenantBackupExecutor.BackupResult backupResult = backupExecutor.executeFullBackup(
                testTenantId, 
                testSchemaName, 
                "Test Tenant"
            );
            
            // 3. 验证备份结果
            assertTrue(backupResult.isSuccess(), "Backup should succeed");
            assertNotNull(backupResult.getBackupPath(), "Backup path should not be null");
            assertNotNull(backupResult.getChecksum(), "Checksum should not be null");
            assertTrue(backupResult.getBackupSize() > 0, "Backup size should be greater than 0");
            
            // 验证备份文件存在
            Path backupPath = Paths.get(backupResult.getBackupPath());
            assertTrue(Files.exists(backupPath), "Backup file should exist");
            
            // 4. 验证元数据
            TenantBackupExecutor.BackupMetadata metadata = backupResult.getMetadata();
            assertNotNull(metadata, "Metadata should not be null");
            assertEquals("Test Tenant", metadata.getTenantName());
            assertEquals(testSchemaName, metadata.getSchemaName());
            assertTrue(metadata.getTableCount() > 0, "Should have at least one table");
            assertTrue(metadata.getRecordCount() >= 3, "Should have at least 3 records");
            
            // 5. 清空表数据
            jdbcTemplate.execute(String.format("TRUNCATE TABLE %s.test_table", testSchemaName));
            
            // 验证数据已清空
            Long countBefore = jdbcTemplate.queryForObject(
                String.format("SELECT COUNT(*) FROM %s.test_table", testSchemaName), 
                Long.class
            );
            assertEquals(0L, countBefore, "Table should be empty before restore");
            
            // 6. 执行恢复
            TenantRestoreExecutor.RestoreResult restoreResult = restoreExecutor.executeRestore(
                backupResult.getBackupPath(),
                testSchemaName,
                true  // overwrite
            );
            
            // 7. 验证恢复结果
            assertTrue(restoreResult.isSuccess(), "Restore should succeed");
            assertTrue(restoreResult.getExecutedStatements() > 0, "Should have executed statements");
            
            // 验证数据已恢复
            Long countAfter = jdbcTemplate.queryForObject(
                String.format("SELECT COUNT(*) FROM %s.test_table", testSchemaName), 
                Long.class
            );
            assertEquals(3L, countAfter, "Should have 3 records after restore");
            
            // 8. 清理备份文件
            try {
                Files.deleteIfExists(backupPath);
            } catch (Exception e) {
                System.err.println("Failed to delete backup file: " + e.getMessage());
            }
            
            System.out.println("✅ 备份和恢复测试通过！");
            System.out.println("   - 备份文件大小: " + backupResult.getBackupSize() + " bytes");
            System.out.println("   - 表数量: " + metadata.getTableCount());
            System.out.println("   - 记录数: " + metadata.getRecordCount());
            System.out.println("   - 恢复语句数: " + restoreResult.getExecutedStatements());
            
        } finally {
            // 清理测试Schema
            try {
                jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + testSchemaName + " CASCADE");
            } catch (Exception e) {
                System.err.println("Failed to cleanup test schema: " + e.getMessage());
            }
        }
    }

    @Test
    public void testBackupFileValidation() {
        // 测试备份文件验证功能
        String nonExistentFile = "/tmp/nonexistent_backup.sql.gz";
        
        TenantRestoreExecutor.ValidationResult result = restoreExecutor.validateBackupFile(
            nonExistentFile, 
            "dummy-checksum"
        );
        
        assertFalse(result.isValid(), "Validation should fail for non-existent file");
        assertNotNull(result.getMessage(), "Should have error message");
        assertTrue(result.getMessage().contains("不存在"), "Error message should mention file not found");
    }
}

