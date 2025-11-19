package com.duanruo.exam.domain.file;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 文件验证器
 * 
 * 提供文件上传的安全验证功能：
 * 1. 文件类型验证（基于扩展名和Magic Number）
 * 2. 文件大小验证
 * 3. 文件名安全性验证
 * 4. 内容类型验证
 */
public class FileValidator {
    
    // 允许的文件扩展名
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx",
            "jpg", "jpeg", "png", "gif", "bmp",
            "txt", "zip", "rar"
    );
    
    // 危险的文件扩展名（禁止上传）
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "exe", "bat", "cmd", "com", "pif", "scr",
            "vbs", "js", "jar", "sh", "ps1", "msi",
            "dll", "so", "dylib"
    );
    
    // 文件名安全性正则（只允许字母、数字、下划线、连字符、点）
    private static final Pattern SAFE_FILENAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\-\\.\\u4e00-\\u9fa5]+$");
    
    // 最大文件名长度
    private static final int MAX_FILENAME_LENGTH = 255;
    
    // 默认最大文件大小（10MB）
    private static final long DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    // Magic Number映射（文件头字节特征）
    private static final java.util.Map<String, byte[]> MAGIC_NUMBERS = java.util.Map.ofEntries(
            // PDF
            java.util.Map.entry("pdf", new byte[]{0x25, 0x50, 0x44, 0x46}), // %PDF
            
            // JPEG
            java.util.Map.entry("jpg", new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF}),
            java.util.Map.entry("jpeg", new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF}),
            
            // PNG
            java.util.Map.entry("png", new byte[]{(byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}),
            
            // GIF
            java.util.Map.entry("gif", new byte[]{0x47, 0x49, 0x46, 0x38}), // GIF8
            
            // ZIP
            java.util.Map.entry("zip", new byte[]{0x50, 0x4B, 0x03, 0x04}), // PK..
            java.util.Map.entry("docx", new byte[]{0x50, 0x4B, 0x03, 0x04}), // DOCX is ZIP
            java.util.Map.entry("xlsx", new byte[]{0x50, 0x4B, 0x03, 0x04}), // XLSX is ZIP
            
            // DOC (MS Word 97-2003)
            java.util.Map.entry("doc", new byte[]{(byte)0xD0, (byte)0xCF, 0x11, (byte)0xE0, (byte)0xA1, (byte)0xB1, 0x1A, (byte)0xE1}),
            
            // XLS (MS Excel 97-2003)
            java.util.Map.entry("xls", new byte[]{(byte)0xD0, (byte)0xCF, 0x11, (byte)0xE0, (byte)0xA1, (byte)0xB1, 0x1A, (byte)0xE1})
    );
    
    /**
     * 验证结果
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;
        private final List<String> errors;
        
        private ValidationResult(boolean valid, String errorMessage, List<String> errors) {
            this.valid = valid;
            this.errorMessage = errorMessage;
            this.errors = errors;
        }
        
        public static ValidationResult success() {
            return new ValidationResult(true, null, List.of());
        }
        
        public static ValidationResult failure(String errorMessage) {
            return new ValidationResult(false, errorMessage, List.of(errorMessage));
        }
        
        public static ValidationResult failure(List<String> errors) {
            return new ValidationResult(false, String.join("; ", errors), errors);
        }
        
        public boolean isValid() { return valid; }
        public String getErrorMessage() { return errorMessage; }
        public List<String> getErrors() { return errors; }
    }
    
    /**
     * 验证文件名安全性
     */
    public static ValidationResult validateFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return ValidationResult.failure("文件名不能为空");
        }
        
        // 去除路径分隔符
        String cleanFileName = fileName.replaceAll("[/\\\\]", "");
        
        // 检查文件名长度
        if (cleanFileName.length() > MAX_FILENAME_LENGTH) {
            return ValidationResult.failure("文件名过长（最大" + MAX_FILENAME_LENGTH + "字符）");
        }
        
        // 检查文件名安全性
        if (!SAFE_FILENAME_PATTERN.matcher(cleanFileName).matches()) {
            return ValidationResult.failure("文件名包含非法字符");
        }
        
        // 检查是否包含多个点（可能是双扩展名攻击）
        long dotCount = cleanFileName.chars().filter(ch -> ch == '.').count();
        if (dotCount > 1) {
            return ValidationResult.failure("文件名不能包含多个点");
        }
        
        return ValidationResult.success();
    }
    
    /**
     * 验证文件扩展名
     */
    public static ValidationResult validateFileExtension(String fileName) {
        String extension = getFileExtension(fileName);
        
        if (extension.isEmpty()) {
            return ValidationResult.failure("文件必须有扩展名");
        }
        
        // 检查是否是危险扩展名
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            return ValidationResult.failure("禁止上传可执行文件");
        }
        
        // 检查是否是允许的扩展名
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ValidationResult.failure("不支持的文件类型: " + extension);
        }
        
        return ValidationResult.success();
    }
    
    /**
     * 验证文件扩展名（自定义允许列表）
     */
    public static ValidationResult validateFileExtension(String fileName, List<String> allowedExtensions) {
        String extension = getFileExtension(fileName);
        
        if (extension.isEmpty()) {
            return ValidationResult.failure("文件必须有扩展名");
        }
        
        // 检查是否是危险扩展名
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            return ValidationResult.failure("禁止上传可执行文件");
        }
        
        // 检查是否在允许列表中
        if (allowedExtensions != null && !allowedExtensions.isEmpty()) {
            if (!allowedExtensions.contains(extension)) {
                return ValidationResult.failure("不支持的文件类型: " + extension + "，允许的类型: " + String.join(", ", allowedExtensions));
            }
        }
        
        return ValidationResult.success();
    }
    
    /**
     * 验证文件大小
     */
    public static ValidationResult validateFileSize(long fileSize) {
        return validateFileSize(fileSize, DEFAULT_MAX_FILE_SIZE);
    }
    
    /**
     * 验证文件大小（自定义最大值）
     */
    public static ValidationResult validateFileSize(long fileSize, long maxSize) {
        if (fileSize <= 0) {
            return ValidationResult.failure("文件大小无效");
        }
        
        if (fileSize > maxSize) {
            return ValidationResult.failure("文件大小超过限制（最大" + formatFileSize(maxSize) + "）");
        }
        
        return ValidationResult.success();
    }
    
    /**
     * 验证文件Magic Number（文件头字节特征）
     */
    public static ValidationResult validateMagicNumber(byte[] fileHeader, String fileName) {
        String extension = getFileExtension(fileName);
        
        if (!MAGIC_NUMBERS.containsKey(extension)) {
            // 如果没有定义Magic Number，跳过验证
            return ValidationResult.success();
        }
        
        byte[] expectedMagic = MAGIC_NUMBERS.get(extension);
        
        if (fileHeader == null || fileHeader.length < expectedMagic.length) {
            return ValidationResult.failure("文件内容不完整");
        }
        
        // 比较文件头
        for (int i = 0; i < expectedMagic.length; i++) {
            if (fileHeader[i] != expectedMagic[i]) {
                return ValidationResult.failure("文件类型与扩展名不匹配");
            }
        }
        
        return ValidationResult.success();
    }
    
    /**
     * 验证内容类型
     */
    public static ValidationResult validateContentType(String contentType, String fileName) {
        if (contentType == null || contentType.trim().isEmpty()) {
            return ValidationResult.failure("内容类型不能为空");
        }
        
        String extension = getFileExtension(fileName);
        
        // 常见的内容类型映射
        java.util.Map<String, List<String>> contentTypeMap = java.util.Map.of(
                "pdf", List.of("application/pdf"),
                "jpg", List.of("image/jpeg", "image/jpg"),
                "jpeg", List.of("image/jpeg", "image/jpg"),
                "png", List.of("image/png"),
                "gif", List.of("image/gif"),
                "doc", List.of("application/msword"),
                "docx", List.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                "xls", List.of("application/vnd.ms-excel"),
                "xlsx", List.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                "zip", List.of("application/zip", "application/x-zip-compressed")
        );
        
        if (contentTypeMap.containsKey(extension)) {
            List<String> expectedTypes = contentTypeMap.get(extension);
            if (!expectedTypes.contains(contentType.toLowerCase())) {
                return ValidationResult.failure("内容类型与文件扩展名不匹配");
            }
        }
        
        return ValidationResult.success();
    }
    
    /**
     * 综合验证
     */
    public static ValidationResult validateFile(String fileName, String contentType, long fileSize, byte[] fileHeader) {
        List<String> errors = new java.util.ArrayList<>();
        
        // 1. 验证文件名
        ValidationResult fileNameResult = validateFileName(fileName);
        if (!fileNameResult.isValid()) {
            errors.addAll(fileNameResult.getErrors());
        }
        
        // 2. 验证扩展名
        ValidationResult extensionResult = validateFileExtension(fileName);
        if (!extensionResult.isValid()) {
            errors.addAll(extensionResult.getErrors());
        }
        
        // 3. 验证文件大小
        ValidationResult sizeResult = validateFileSize(fileSize);
        if (!sizeResult.isValid()) {
            errors.addAll(sizeResult.getErrors());
        }
        
        // 4. 验证内容类型
        ValidationResult contentTypeResult = validateContentType(contentType, fileName);
        if (!contentTypeResult.isValid()) {
            errors.addAll(contentTypeResult.getErrors());
        }
        
        // 5. 验证Magic Number
        if (fileHeader != null && fileHeader.length > 0) {
            ValidationResult magicResult = validateMagicNumber(fileHeader, fileName);
            if (!magicResult.isValid()) {
                errors.addAll(magicResult.getErrors());
            }
        }
        
        if (errors.isEmpty()) {
            return ValidationResult.success();
        } else {
            return ValidationResult.failure(errors);
        }
    }
    
    /**
     * 获取文件扩展名
     */
    private static String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }
    
    /**
     * 格式化文件大小
     */
    private static String formatFileSize(long size) {
        if (size < 1024) {
            return size + " B";
        } else if (size < 1024 * 1024) {
            return String.format("%.2f KB", size / 1024.0);
        } else {
            return String.format("%.2f MB", size / (1024.0 * 1024.0));
        }
    }
}

