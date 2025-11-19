package com.duanruo.exam.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * 文件上传配置
 */
@Configuration
@ConfigurationProperties(prefix = "exam.file")
public class FileUploadConfig {
    
    /**
     * 最大文件大小（字节）
     */
    private long maxSize = 10 * 1024 * 1024; // 默认10MB
    
    /**
     * 允许的文件类型（扩展名）
     */
    private List<String> allowedTypes = List.of("pdf", "doc", "docx", "jpg", "jpeg", "png");
    
    /**
     * 病毒扫描配置
     */
    private VirusScan virusScan = new VirusScan();
    
    /**
     * 是否启用Magic Number验证
     */
    private boolean enableMagicNumberValidation = true;
    
    /**
     * 是否启用文件名安全性检查
     */
    private boolean enableFileNameValidation = true;
    
    /**
     * 是否启用内容类型验证
     */
    private boolean enableContentTypeValidation = true;
    
    public long getMaxSize() {
        return maxSize;
    }
    
    public void setMaxSize(long maxSize) {
        this.maxSize = maxSize;
    }
    
    public List<String> getAllowedTypes() {
        return allowedTypes;
    }
    
    public void setAllowedTypes(List<String> allowedTypes) {
        this.allowedTypes = allowedTypes;
    }
    
    public VirusScan getVirusScan() {
        return virusScan;
    }
    
    public void setVirusScan(VirusScan virusScan) {
        this.virusScan = virusScan;
    }
    
    public boolean isEnableMagicNumberValidation() {
        return enableMagicNumberValidation;
    }
    
    public void setEnableMagicNumberValidation(boolean enableMagicNumberValidation) {
        this.enableMagicNumberValidation = enableMagicNumberValidation;
    }
    
    public boolean isEnableFileNameValidation() {
        return enableFileNameValidation;
    }
    
    public void setEnableFileNameValidation(boolean enableFileNameValidation) {
        this.enableFileNameValidation = enableFileNameValidation;
    }
    
    public boolean isEnableContentTypeValidation() {
        return enableContentTypeValidation;
    }
    
    public void setEnableContentTypeValidation(boolean enableContentTypeValidation) {
        this.enableContentTypeValidation = enableContentTypeValidation;
    }
    
    /**
     * 病毒扫描配置
     */
    public static class VirusScan {
        /**
         * 是否启用病毒扫描
         */
        private boolean enabled = false;
        
        /**
         * 扫描引擎类型（clamav, mock）
         */
        private String engine = "mock";
        
        /**
         * ClamAV服务器地址
         */
        private String clamavHost = "localhost";
        
        /**
         * ClamAV服务器端口
         */
        private int clamavPort = 3310;
        
        /**
         * 扫描超时时间（秒）
         */
        private int timeout = 30;
        
        public boolean isEnabled() {
            return enabled;
        }
        
        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
        
        public String getEngine() {
            return engine;
        }
        
        public void setEngine(String engine) {
            this.engine = engine;
        }
        
        public String getClamavHost() {
            return clamavHost;
        }
        
        public void setClamavHost(String clamavHost) {
            this.clamavHost = clamavHost;
        }
        
        public int getClamavPort() {
            return clamavPort;
        }
        
        public void setClamavPort(int clamavPort) {
            this.clamavPort = clamavPort;
        }
        
        public int getTimeout() {
            return timeout;
        }
        
        public void setTimeout(int timeout) {
            this.timeout = timeout;
        }
    }
}

