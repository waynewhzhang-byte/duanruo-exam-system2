package com.duanruo.exam.domain.file;

/**
 * 病毒扫描服务接口
 */
public interface VirusScanService {
    
    /**
     * 扫描结果
     */
    enum ScanResult {
        CLEAN,      // 干净
        INFECTED,   // 感染
        ERROR       // 扫描错误
    }
    
    /**
     * 扫描文件
     * 
     * @param objectKey 文件对象键
     * @return 扫描结果
     */
    ScanResult scanFile(String objectKey);
    
    /**
     * 扫描文件（带详细信息）
     * 
     * @param objectKey 文件对象键
     * @return 扫描详情
     */
    ScanDetail scanFileWithDetail(String objectKey);
    
    /**
     * 扫描详情
     */
    class ScanDetail {
        private final ScanResult result;
        private final String virusName;
        private final String message;
        private final long scanTimeMs;
        
        public ScanDetail(ScanResult result, String virusName, String message, long scanTimeMs) {
            this.result = result;
            this.virusName = virusName;
            this.message = message;
            this.scanTimeMs = scanTimeMs;
        }
        
        public ScanResult getResult() { return result; }
        public String getVirusName() { return virusName; }
        public String getMessage() { return message; }
        public long getScanTimeMs() { return scanTimeMs; }
        
        public boolean isClean() { return result == ScanResult.CLEAN; }
        public boolean isInfected() { return result == ScanResult.INFECTED; }
        public boolean isError() { return result == ScanResult.ERROR; }
    }
}

