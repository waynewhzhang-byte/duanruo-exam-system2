package com.duanruo.exam.infrastructure.virus;

import com.duanruo.exam.domain.file.VirusScanService;
import com.duanruo.exam.infrastructure.config.FileUploadConfig;
import com.duanruo.exam.infrastructure.storage.MinioFileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/**
 * ClamAV病毒扫描服务
 * 
 * 使用ClamAV守护进程（clamd）进行病毒扫描
 * 
 * 安装ClamAV:
 * - Ubuntu/Debian: sudo apt-get install clamav clamav-daemon
 * - CentOS/RHEL: sudo yum install clamav clamav-scanner
 * - macOS: brew install clamav
 * - Windows: 下载安装包 https://www.clamav.net/downloads
 * 
 * 启动clamd:
 * - Linux: sudo systemctl start clamav-daemon
 * - macOS: clamd
 * - Windows: 运行ClamAV服务
 */
@Service
@ConditionalOnProperty(name = "exam.file.virus-scan.engine", havingValue = "clamav")
public class ClamAVVirusScanService implements VirusScanService {
    
    private static final Logger logger = LoggerFactory.getLogger(ClamAVVirusScanService.class);
    
    private static final String PING_COMMAND = "zPING\0";
    private static final String INSTREAM_COMMAND = "zINSTREAM\0";
    private static final int CHUNK_SIZE = 2048;
    
    private final FileUploadConfig fileUploadConfig;
    private final MinioFileStorageService storageService;
    
    public ClamAVVirusScanService(FileUploadConfig fileUploadConfig,
                                  MinioFileStorageService storageService) {
        this.fileUploadConfig = fileUploadConfig;
        this.storageService = storageService;
    }
    
    @Override
    public ScanResult scanFile(String objectKey) {
        ScanDetail detail = scanFileWithDetail(objectKey);
        return detail.getResult();
    }
    
    @Override
    public ScanDetail scanFileWithDetail(String objectKey) {
        long startTime = System.currentTimeMillis();
        
        try {
            // 1. 检查ClamAV服务是否可用
            if (!ping()) {
                logger.error("ClamAV service is not available");
                return new ScanDetail(
                    ScanResult.ERROR,
                    null,
                    "ClamAV服务不可用",
                    System.currentTimeMillis() - startTime
                );
            }
            
            // 2. 从MinIO下载文件并扫描
            try (InputStream fileStream = storageService.downloadFile(objectKey)) {
                String scanResponse = scanStream(fileStream);
                long scanTime = System.currentTimeMillis() - startTime;
                
                // 3. 解析扫描结果
                return parseScanResponse(scanResponse, scanTime);
                
            } catch (IOException e) {
                logger.error("Failed to download file for scanning: {}", objectKey, e);
                return new ScanDetail(
                    ScanResult.ERROR,
                    null,
                    "文件下载失败: " + e.getMessage(),
                    System.currentTimeMillis() - startTime
                );
            }
            
        } catch (Exception e) {
            logger.error("Virus scan failed for file: {}", objectKey, e);
            return new ScanDetail(
                ScanResult.ERROR,
                null,
                "扫描失败: " + e.getMessage(),
                System.currentTimeMillis() - startTime
            );
        }
    }
    
    /**
     * 检查ClamAV服务是否可用
     */
    private boolean ping() {
        try (Socket socket = createSocket()) {
            OutputStream out = socket.getOutputStream();
            InputStream in = socket.getInputStream();
            
            // 发送PING命令
            out.write(PING_COMMAND.getBytes(StandardCharsets.UTF_8));
            out.flush();
            
            // 读取响应
            byte[] response = new byte[4];
            int bytesRead = in.read(response);
            
            if (bytesRead > 0) {
                String responseStr = new String(response, 0, bytesRead, StandardCharsets.UTF_8);
                return "PONG".equals(responseStr.trim());
            }
            
            return false;
            
        } catch (IOException e) {
            logger.error("Failed to ping ClamAV service", e);
            return false;
        }
    }
    
    /**
     * 扫描文件流
     */
    private String scanStream(InputStream fileStream) throws IOException {
        try (Socket socket = createSocket()) {
            OutputStream out = socket.getOutputStream();
            InputStream in = socket.getInputStream();
            
            // 发送INSTREAM命令
            out.write(INSTREAM_COMMAND.getBytes(StandardCharsets.UTF_8));
            
            // 发送文件数据（分块）
            byte[] buffer = new byte[CHUNK_SIZE];
            int bytesRead;
            
            while ((bytesRead = fileStream.read(buffer)) != -1) {
                // 发送块大小（4字节，网络字节序）
                byte[] chunkSize = ByteBuffer.allocate(4).putInt(bytesRead).array();
                out.write(chunkSize);
                
                // 发送块数据
                out.write(buffer, 0, bytesRead);
            }
            
            // 发送结束标记（0字节）
            out.write(new byte[]{0, 0, 0, 0});
            out.flush();
            
            // 读取扫描结果
            byte[] response = new byte[1024];
            int responseLength = in.read(response);
            
            if (responseLength > 0) {
                return new String(response, 0, responseLength, StandardCharsets.UTF_8).trim();
            }
            
            return "ERROR: No response from ClamAV";
            
        }
    }
    
    /**
     * 解析扫描响应
     * 
     * 响应格式:
     * - "stream: OK" - 文件干净
     * - "stream: {virus_name} FOUND" - 发现病毒
     * - "stream: {error_message} ERROR" - 扫描错误
     */
    private ScanDetail parseScanResponse(String response, long scanTime) {
        if (response == null || response.isEmpty()) {
            return new ScanDetail(
                ScanResult.ERROR,
                null,
                "扫描响应为空",
                scanTime
            );
        }
        
        // 移除"stream: "前缀
        String result = response.replace("stream: ", "").trim();
        
        if (result.equals("OK")) {
            return new ScanDetail(
                ScanResult.CLEAN,
                null,
                "文件扫描通过，未发现病毒",
                scanTime
            );
        }
        
        if (result.endsWith("FOUND")) {
            // 提取病毒名称
            String virusName = result.replace(" FOUND", "").trim();
            return new ScanDetail(
                ScanResult.INFECTED,
                virusName,
                "检测到病毒: " + virusName,
                scanTime
            );
        }
        
        if (result.endsWith("ERROR")) {
            // 提取错误信息
            String errorMessage = result.replace(" ERROR", "").trim();
            return new ScanDetail(
                ScanResult.ERROR,
                null,
                "扫描错误: " + errorMessage,
                scanTime
            );
        }
        
        // 未知响应
        return new ScanDetail(
            ScanResult.ERROR,
            null,
            "未知的扫描响应: " + result,
            scanTime
        );
    }
    
    /**
     * 创建到ClamAV服务的Socket连接
     */
    private Socket createSocket() throws IOException {
        String host = fileUploadConfig.getVirusScan().getClamavHost();
        int port = fileUploadConfig.getVirusScan().getClamavPort();
        int timeout = fileUploadConfig.getVirusScan().getTimeout() * 1000; // 转换为毫秒
        
        Socket socket = new Socket(host, port);
        socket.setSoTimeout(timeout);
        
        return socket;
    }
}

