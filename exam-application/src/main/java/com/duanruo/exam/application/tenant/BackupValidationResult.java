package com.duanruo.exam.application.tenant;

import java.util.ArrayList;
import java.util.List;

/**
 * 备份验证结果
 */
public class BackupValidationResult {
    
    private boolean valid;
    private List<String> errors;
    private List<String> warnings;
    private ValidationDetails details;
    
    public BackupValidationResult() {
        this.errors = new ArrayList<>();
        this.warnings = new ArrayList<>();
    }
    
    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
    
    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
    
    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
    
    public ValidationDetails getDetails() { return details; }
    public void setDetails(ValidationDetails details) { this.details = details; }
    
    public void addError(String error) {
        this.errors.add(error);
        this.valid = false;
    }
    
    public void addWarning(String warning) {
        this.warnings.add(warning);
    }
    
    public static class ValidationDetails {
        private boolean checksumValid;
        private boolean fileExists;
        private boolean fileReadable;
        private Long expectedSize;
        private Long actualSize;
        private String expectedChecksum;
        private String actualChecksum;
        
        public boolean isChecksumValid() { return checksumValid; }
        public void setChecksumValid(boolean checksumValid) { this.checksumValid = checksumValid; }
        
        public boolean isFileExists() { return fileExists; }
        public void setFileExists(boolean fileExists) { this.fileExists = fileExists; }
        
        public boolean isFileReadable() { return fileReadable; }
        public void setFileReadable(boolean fileReadable) { this.fileReadable = fileReadable; }
        
        public Long getExpectedSize() { return expectedSize; }
        public void setExpectedSize(Long expectedSize) { this.expectedSize = expectedSize; }
        
        public Long getActualSize() { return actualSize; }
        public void setActualSize(Long actualSize) { this.actualSize = actualSize; }
        
        public String getExpectedChecksum() { return expectedChecksum; }
        public void setExpectedChecksum(String expectedChecksum) { 
            this.expectedChecksum = expectedChecksum; 
        }
        
        public String getActualChecksum() { return actualChecksum; }
        public void setActualChecksum(String actualChecksum) { this.actualChecksum = actualChecksum; }
    }
}

