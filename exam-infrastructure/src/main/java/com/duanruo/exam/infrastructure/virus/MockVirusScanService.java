package com.duanruo.exam.infrastructure.virus;

import com.duanruo.exam.domain.file.VirusScanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Mock病毒扫描服务（用于开发和测试）
 */
@Service
@ConditionalOnProperty(name = "exam.file.virus-scan.engine", havingValue = "mock", matchIfMissing = true)
public class MockVirusScanService implements VirusScanService {
    
    private static final Logger logger = LoggerFactory.getLogger(MockVirusScanService.class);
    
    @Override
    public ScanResult scanFile(String objectKey) {
        logger.info("Mock virus scan for file: {}", objectKey);
        
        // Mock实现：总是返回CLEAN
        // 可以通过文件名模拟不同的扫描结果
        if (objectKey.contains("virus") || objectKey.contains("infected")) {
            logger.warn("Mock virus scan detected infected file: {}", objectKey);
            return ScanResult.INFECTED;
        }
        
        if (objectKey.contains("error")) {
            logger.error("Mock virus scan error for file: {}", objectKey);
            return ScanResult.ERROR;
        }
        
        return ScanResult.CLEAN;
    }
    
    @Override
    public ScanDetail scanFileWithDetail(String objectKey) {
        long startTime = System.currentTimeMillis();
        
        ScanResult result = scanFile(objectKey);
        long scanTime = System.currentTimeMillis() - startTime;
        
        String virusName = null;
        String message = null;
        
        switch (result) {
            case CLEAN:
                message = "文件扫描通过，未发现病毒";
                break;
            case INFECTED:
                virusName = "Mock.Virus.Test";
                message = "检测到病毒: " + virusName;
                break;
            case ERROR:
                message = "扫描过程中发生错误";
                break;
        }
        
        return new ScanDetail(result, virusName, message, scanTime);
    }
}

