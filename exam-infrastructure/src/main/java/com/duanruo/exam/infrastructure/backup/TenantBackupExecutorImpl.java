package com.duanruo.exam.infrastructure.backup;

import com.duanruo.exam.domain.tenant.TenantBackupExecutor;
import com.duanruo.exam.shared.domain.TenantId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPOutputStream;

@Component
public class TenantBackupExecutorImpl implements TenantBackupExecutor {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantBackupExecutorImpl.class);
    private static final String APP_VERSION = "1.0.0";
    
    private final JdbcTemplate jdbcTemplate;
    private final String backupBasePath;
    
    public TenantBackupExecutorImpl(
        JdbcTemplate jdbcTemplate,
        @Value("${app.tenant.backup.base-path:./backups}") String backupBasePath
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.backupBasePath = backupBasePath;
    }
    
    @Override
    public BackupResult executeFullBackup(TenantId tenantId, String schemaName, String tenantName) {
        logger.info("开始执行租户 {} 的全量备份, schema: {}", tenantId.getValue(), schemaName);
        
        try {
            Path backupDir = createBackupDirectory(tenantId);
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String backupFileName = String.format("tenant_%s_full_%s.sql.gz", tenantId.getValue(), timestamp);
            Path backupFilePath = backupDir.resolve(backupFileName);
            
            BackupMetadata metadata = collectMetadata(schemaName, tenantName);
            
            long startTime = System.currentTimeMillis();
            executeBackupToFile(schemaName, backupFilePath);
            long duration = System.currentTimeMillis() - startTime;
            
            String checksum = calculateChecksum(backupFilePath);
            long fileSize = Files.size(backupFilePath);
            
            logger.info("租户 {} 备份完成, 文件: {}, 大小: {} bytes, 耗时: {} ms", 
                tenantId.getValue(), backupFileName, fileSize, duration);
            
            return new BackupResult(true, backupFilePath.toString(), fileSize, checksum, metadata, null);
            
        } catch (Exception e) {
            logger.error("租户 {} 备份失败", tenantId.getValue(), e);
            return new BackupResult(false, null, null, null, null, e.getMessage());
        }
    }
    
    private Path createBackupDirectory(TenantId tenantId) throws IOException {
        Path backupDir = Paths.get(backupBasePath, tenantId.getValue().toString());
        Files.createDirectories(backupDir);
        return backupDir;
    }
    
    private BackupMetadata collectMetadata(String schemaName, String tenantName) {
        String dbVersion = jdbcTemplate.queryForObject("SELECT version()", String.class);
        
        List<Map<String, Object>> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = ?", schemaName
        );
        
        Long totalRecords = estimateTotalRecords(schemaName);
        
        return new BackupMetadata(
            tenantName,
            schemaName,
            tables.size(),
            totalRecords,
            dbVersion,
            APP_VERSION
        );
    }
    
    private Long estimateTotalRecords(String schemaName) {
        List<Map<String, Object>> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = ?", schemaName
        );
        
        long total = 0;
        for (Map<String, Object> table : tables) {
            String tableName = (String) table.get("table_name");
            try {
                Long count = jdbcTemplate.queryForObject(
                    String.format("SELECT COUNT(*) FROM %s.%s", schemaName, tableName), Long.class
                );
                total += (count != null ? count : 0);
            } catch (Exception e) {
                logger.warn("无法统计表 {}.{} 的记录数", schemaName, tableName);
            }
        }
        return total;
    }
    
    private void executeBackupToFile(String schemaName, Path backupFilePath) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(backupFilePath.toFile());
             GZIPOutputStream gzos = new GZIPOutputStream(fos);
             BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(gzos))) {
            
            writer.write("-- Tenant Schema Backup\n");
            writer.write("-- Schema: " + schemaName + "\n");
            writer.write("-- Date: " + LocalDateTime.now() + "\n\n");
            
            List<Map<String, Object>> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = ?", schemaName
            );
            
            for (Map<String, Object> table : tables) {
                backupTable(schemaName, (String) table.get("table_name"), writer);
            }
        }
    }
    
    private void backupTable(String schemaName, String tableName, BufferedWriter writer) throws IOException {
        writer.write("-- Table: " + tableName + "\n");
        
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            String.format("SELECT * FROM %s.%s", schemaName, tableName)
        );
        
        if (rows.isEmpty()) {
            writer.write("-- No data\n\n");
            return;
        }
        
        for (Map<String, Object> row : rows) {
            writer.write(generateInsertStatement(tableName, row) + ";\n");
        }
        writer.write("\n");
    }
    
    private String generateInsertStatement(String tableName, Map<String, Object> row) {
        StringBuilder columns = new StringBuilder();
        StringBuilder values = new StringBuilder();
        
        boolean first = true;
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (!first) {
                columns.append(", ");
                values.append(", ");
            }
            columns.append(entry.getKey());
            values.append(formatValue(entry.getValue()));
            first = false;
        }
        
        return String.format("INSERT INTO %s (%s) VALUES (%s)", tableName, columns, values);
    }
    
    private String formatValue(Object value) {
        if (value == null) {
            return "NULL";
        }
        if (value instanceof String) {
            return "'" + ((String) value).replace("'", "''") + "'";
        }
        if (value instanceof LocalDateTime) {
            return "'" + value.toString() + "'";
        }
        return value.toString();
    }
    
    private String calculateChecksum(Path filePath) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream fis = Files.newInputStream(filePath)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
        }
        
        byte[] hashBytes = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}