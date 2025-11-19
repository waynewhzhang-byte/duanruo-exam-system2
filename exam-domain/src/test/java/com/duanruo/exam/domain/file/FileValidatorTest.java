package com.duanruo.exam.domain.file;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 文件验证器测试
 */
class FileValidatorTest {
    
    // ========== 文件名验证测试 ==========
    
    @Test
    void testValidateFileName_Valid() {
        FileValidator.ValidationResult result = FileValidator.validateFileName("document.pdf");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateFileName_ValidWithChinese() {
        FileValidator.ValidationResult result = FileValidator.validateFileName("身份证.pdf");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateFileName_Empty() {
        FileValidator.ValidationResult result = FileValidator.validateFileName("");
        assertFalse(result.isValid());
        assertEquals("文件名不能为空", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileName_Null() {
        FileValidator.ValidationResult result = FileValidator.validateFileName(null);
        assertFalse(result.isValid());
        assertEquals("文件名不能为空", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileName_TooLong() {
        String longName = "a".repeat(256) + ".pdf";
        FileValidator.ValidationResult result = FileValidator.validateFileName(longName);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("文件名过长"));
    }
    
    @Test
    void testValidateFileName_IllegalCharacters() {
        FileValidator.ValidationResult result = FileValidator.validateFileName("file<>.pdf");
        assertFalse(result.isValid());
        assertEquals("文件名包含非法字符", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileName_MultipleDots() {
        FileValidator.ValidationResult result = FileValidator.validateFileName("file.test.pdf");
        assertFalse(result.isValid());
        assertEquals("文件名不能包含多个点", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileName_PathTraversal() {
        FileValidator.ValidationResult result = FileValidator.validateFileName("../../../etc/passwd");
        assertFalse(result.isValid());
        // 路径遍历攻击会被"多个点"规则拦截
        assertEquals("文件名不能包含多个点", result.getErrorMessage());
    }
    
    // ========== 文件扩展名验证测试 ==========
    
    @Test
    void testValidateFileExtension_ValidPDF() {
        FileValidator.ValidationResult result = FileValidator.validateFileExtension("document.pdf");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateFileExtension_ValidJPG() {
        FileValidator.ValidationResult result = FileValidator.validateFileExtension("photo.jpg");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateFileExtension_NoExtension() {
        FileValidator.ValidationResult result = FileValidator.validateFileExtension("document");
        assertFalse(result.isValid());
        assertEquals("文件必须有扩展名", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileExtension_DangerousEXE() {
        FileValidator.ValidationResult result = FileValidator.validateFileExtension("virus.exe");
        assertFalse(result.isValid());
        assertEquals("禁止上传可执行文件", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileExtension_DangerousSH() {
        FileValidator.ValidationResult result = FileValidator.validateFileExtension("script.sh");
        assertFalse(result.isValid());
        assertEquals("禁止上传可执行文件", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileExtension_UnsupportedType() {
        FileValidator.ValidationResult result = FileValidator.validateFileExtension("file.mp4");
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("不支持的文件类型"));
    }
    
    @Test
    void testValidateFileExtension_CustomAllowedTypes() {
        List<String> allowedTypes = List.of("pdf", "jpg");
        FileValidator.ValidationResult result = FileValidator.validateFileExtension("document.pdf", allowedTypes);
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateFileExtension_CustomAllowedTypes_NotAllowed() {
        List<String> allowedTypes = List.of("pdf", "jpg");
        FileValidator.ValidationResult result = FileValidator.validateFileExtension("document.docx", allowedTypes);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("不支持的文件类型"));
    }
    
    // ========== 文件大小验证测试 ==========
    
    @Test
    void testValidateFileSize_Valid() {
        FileValidator.ValidationResult result = FileValidator.validateFileSize(5 * 1024 * 1024); // 5MB
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateFileSize_TooLarge() {
        FileValidator.ValidationResult result = FileValidator.validateFileSize(15 * 1024 * 1024); // 15MB
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("文件大小超过限制"));
    }
    
    @Test
    void testValidateFileSize_Zero() {
        FileValidator.ValidationResult result = FileValidator.validateFileSize(0);
        assertFalse(result.isValid());
        assertEquals("文件大小无效", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileSize_Negative() {
        FileValidator.ValidationResult result = FileValidator.validateFileSize(-1);
        assertFalse(result.isValid());
        assertEquals("文件大小无效", result.getErrorMessage());
    }
    
    @Test
    void testValidateFileSize_CustomMaxSize() {
        FileValidator.ValidationResult result = FileValidator.validateFileSize(5 * 1024 * 1024, 20 * 1024 * 1024);
        assertTrue(result.isValid());
    }
    
    // ========== Magic Number验证测试 ==========
    
    @Test
    void testValidateMagicNumber_ValidPDF() {
        byte[] pdfHeader = {0x25, 0x50, 0x44, 0x46}; // %PDF
        FileValidator.ValidationResult result = FileValidator.validateMagicNumber(pdfHeader, "document.pdf");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateMagicNumber_ValidJPEG() {
        byte[] jpegHeader = {(byte)0xFF, (byte)0xD8, (byte)0xFF, (byte)0xE0};
        FileValidator.ValidationResult result = FileValidator.validateMagicNumber(jpegHeader, "photo.jpg");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateMagicNumber_ValidPNG() {
        byte[] pngHeader = {(byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        FileValidator.ValidationResult result = FileValidator.validateMagicNumber(pngHeader, "image.png");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateMagicNumber_Mismatch() {
        byte[] fakeHeader = {0x00, 0x00, 0x00, 0x00};
        FileValidator.ValidationResult result = FileValidator.validateMagicNumber(fakeHeader, "document.pdf");
        assertFalse(result.isValid());
        assertEquals("文件类型与扩展名不匹配", result.getErrorMessage());
    }
    
    @Test
    void testValidateMagicNumber_Incomplete() {
        byte[] incompleteHeader = {0x25, 0x50}; // 不完整的PDF头
        FileValidator.ValidationResult result = FileValidator.validateMagicNumber(incompleteHeader, "document.pdf");
        assertFalse(result.isValid());
        assertEquals("文件内容不完整", result.getErrorMessage());
    }
    
    @Test
    void testValidateMagicNumber_NoMagicNumberDefined() {
        byte[] anyHeader = {0x00, 0x00, 0x00, 0x00};
        FileValidator.ValidationResult result = FileValidator.validateMagicNumber(anyHeader, "file.txt");
        assertTrue(result.isValid()); // TXT没有定义Magic Number，跳过验证
    }
    
    // ========== 内容类型验证测试 ==========
    
    @Test
    void testValidateContentType_ValidPDF() {
        FileValidator.ValidationResult result = FileValidator.validateContentType("application/pdf", "document.pdf");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateContentType_ValidJPEG() {
        FileValidator.ValidationResult result = FileValidator.validateContentType("image/jpeg", "photo.jpg");
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateContentType_Empty() {
        FileValidator.ValidationResult result = FileValidator.validateContentType("", "document.pdf");
        assertFalse(result.isValid());
        assertEquals("内容类型不能为空", result.getErrorMessage());
    }
    
    @Test
    void testValidateContentType_Null() {
        FileValidator.ValidationResult result = FileValidator.validateContentType(null, "document.pdf");
        assertFalse(result.isValid());
        assertEquals("内容类型不能为空", result.getErrorMessage());
    }
    
    @Test
    void testValidateContentType_Mismatch() {
        FileValidator.ValidationResult result = FileValidator.validateContentType("image/jpeg", "document.pdf");
        assertFalse(result.isValid());
        assertEquals("内容类型与文件扩展名不匹配", result.getErrorMessage());
    }
    
    // ========== 综合验证测试 ==========
    
    @Test
    void testValidateFile_AllValid() {
        byte[] pdfHeader = {0x25, 0x50, 0x44, 0x46};
        FileValidator.ValidationResult result = FileValidator.validateFile(
            "document.pdf",
            "application/pdf",
            5 * 1024 * 1024,
            pdfHeader
        );
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidateFile_MultipleErrors() {
        byte[] fakeHeader = {0x00, 0x00, 0x00, 0x00};
        FileValidator.ValidationResult result = FileValidator.validateFile(
            "file<>.exe",
            "application/octet-stream",
            15 * 1024 * 1024,
            fakeHeader
        );
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() > 1);
    }
    
    @Test
    void testValidateFile_NoFileHeader() {
        FileValidator.ValidationResult result = FileValidator.validateFile(
            "document.pdf",
            "application/pdf",
            5 * 1024 * 1024,
            null
        );
        assertTrue(result.isValid()); // 没有文件头时跳过Magic Number验证
    }
}

