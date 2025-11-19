package com.duanruo.exam.infrastructure.backup;

import com.duanruo.exam.domain.tenant.TenantRestoreExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPInputStream;

@Component
public class TenantRestoreExecutorImpl implements TenantRestoreExecutor {
    
    private static final Logger logger = LoggerFactory.getLogger(TenantRestoreExecutorImpl.class);
    
    private final JdbcTemplate jdbcTemplate;
    
    public TenantRestoreExecutorImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @Override
    public RestoreResult executeRestore(String backupFilePath, String targetSchemaName, boolean overwrite) {
        logger.info("开始恢复租户数据: backupFile={}, schema={}, overwrite={}",
            backupFilePath, targetSchemaName, overwrite);

        try {
            Path backupPath = Paths.get(backupFilePath);

            if (!Files.exists(backupPath)) {
                return new RestoreResult(false, 0, 0L, "备份文件不存在: " + backupFilePath);
            }

            if (overwrite) {
                clearSchemaData(targetSchemaName);
            }

            long startTime = System.currentTimeMillis();
            int recordsRestored = restoreFromFile(backupPath, targetSchemaName);
            long duration = System.currentTimeMillis() - startTime;

            logger.info("租户数据恢复完成: {} 条记录, 耗时: {} ms", recordsRestored, duration);

            return new RestoreResult(true, recordsRestored, duration, null);

        } catch (Exception e) {
            logger.error("租户数据恢复失败", e);
            return new RestoreResult(false, 0, 0L, e.getMessage());
        }
    }

    @Override
    public ValidationResult validateBackupFile(String backupFilePath, String expectedChecksum) {
        try {
            Path backupPath = Paths.get(backupFilePath);

            if (!Files.exists(backupPath)) {
                return new ValidationResult(false, "备份文件不存在: " + backupFilePath);
            }

            if (!Files.isReadable(backupPath)) {
                return new ValidationResult(false, "备份文件不可读: " + backupFilePath);
            }

            String actualChecksum = calculateChecksum(backupPath);
            if (!actualChecksum.equals(expectedChecksum)) {
                return new ValidationResult(false,
                    String.format("校验和不匹配: expected=%s, actual=%s", expectedChecksum, actualChecksum));
            }

            return new ValidationResult(true, null);

        } catch (Exception e) {
            return new ValidationResult(false, "验证失败: " + e.getMessage());
        }
    }
    
    private void clearSchemaData(String schemaName) {
        logger.info("清空Schema数据: {}", schemaName);
        
        List<Map<String, Object>> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = ?", schemaName
        );
        
        jdbcTemplate.execute("SET session_replication_role = 'replica'");
        
        try {
            for (Map<String, Object> table : tables) {
                String tableName = (String) table.get("table_name");
                jdbcTemplate.execute(String.format("TRUNCATE TABLE %s.%s CASCADE", schemaName, tableName));
            }
        } finally {
            jdbcTemplate.execute("SET session_replication_role = 'origin'");
        }
    }
    
    private int restoreFromFile(Path backupFilePath, String targetSchemaName) throws IOException {
        int recordsRestored = 0;
        
        jdbcTemplate.execute("SET session_replication_role = 'replica'");
        
        try (FileInputStream fis = new FileInputStream(backupFilePath.toFile());
             GZIPInputStream gzis = new GZIPInputStream(fis);
             BufferedReader reader = new BufferedReader(new InputStreamReader(gzis))) {
            
            String line;
            StringBuilder sqlStatement = new StringBuilder();
            
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                
                if (line.isEmpty() || line.startsWith("--")) {
                    continue;
                }
                
                sqlStatement.append(line);
                
                if (line.endsWith(";")) {
                    String sql = sqlStatement.toString();
                    sql = sql.substring(0, sql.length() - 1);
                    
                    if (sql.toUpperCase().startsWith("INSERT INTO")) {
                        sql = sql.replaceFirst("INSERT INTO (\\w+)", 
                            "INSERT INTO " + targetSchemaName + ".$1");
                        
                        jdbcTemplate.execute(sql);
                        recordsRestored++;
                    }
                    
                    sqlStatement.setLength(0);
                }
            }
        } finally {
            jdbcTemplate.execute("SET session_replication_role = 'origin'");
        }
        
        return recordsRestored;
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

