package com.duanruo.exam.infrastructure.service;

import com.duanruo.exam.domain.file.AttachmentRequirement;
import com.duanruo.exam.domain.file.AttachmentValidationResult;
import com.duanruo.exam.domain.file.AttachmentValidationService;
import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * 附件验证服务测试
 */
@ExtendWith(MockitoExtension.class)
class AttachmentValidationServiceImplTest {
    
    @Mock
    private JpaFileRepository fileRepository;
    
    private AttachmentValidationService validationService;
    
    @BeforeEach
    void setUp() {
        validationService = new AttachmentValidationServiceImpl(fileRepository);
    }
    
    // ========== 必填附件验证测试 ==========
    
    @Test
    void testValidate_RequiredAttachment_Missing() {
        // 准备数据
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("idCard")
                .fieldLabel("身份证")
                .required(true)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        // 没有提供idCard附件
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertEquals("缺少必需附件: 身份证", result.getErrors().get(0).getMessage());
        assertEquals(AttachmentValidationResult.ErrorType.MISSING_REQUIRED, 
                result.getErrors().get(0).getErrorType());
    }
    
    @Test
    void testValidate_RequiredAttachment_EmptyList() {
        // 准备数据
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("idCard")
                .fieldLabel("身份证")
                .required(true)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        attachments.put("idCard", new ArrayList<>()); // 空列表
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertEquals("缺少必需附件: 身份证", result.getErrors().get(0).getMessage());
    }
    
    @Test
    void testValidate_RequiredAttachment_Provided() {
        // 准备数据
        UUID fileId = UUID.randomUUID();
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("idCard")
                .fieldLabel("身份证")
                .required(true)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        attachments.put("idCard", List.of(fileId));
        
        // Mock文件存在且可用
        FileEntity fileEntity = new FileEntity();
        fileEntity.setId(fileId);
        fileEntity.setOriginalName("idcard.jpg");
        fileEntity.setStatus(FileEntity.FileStatus.AVAILABLE);
        fileEntity.setVirusScanStatus(FileEntity.VirusScanStatus.CLEAN);
        fileEntity.setFileSize(1024L);
        
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertTrue(result.isValid());
        assertEquals(0, result.getErrors().size());
    }
    
    @Test
    void testValidate_OptionalAttachment_NotProvided() {
        // 准备数据
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("resume")
                .fieldLabel("简历")
                .required(false)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        // 没有提供resume附件
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertTrue(result.isValid()); // 可选附件，不提供也通过
        assertEquals(0, result.getErrors().size());
    }
    
    // ========== 文件数量验证测试 ==========
    
    @Test
    void testValidate_MinFiles_TooFew() {
        // 准备数据
        UUID fileId = UUID.randomUUID();
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("photos")
                .fieldLabel("照片")
                .required(true)
                .minFiles(2)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        attachments.put("photos", List.of(fileId)); // 只有1个文件
        
        // Mock文件存在且可用
        FileEntity fileEntity = new FileEntity();
        fileEntity.setId(fileId);
        fileEntity.setOriginalName("photo1.jpg");
        fileEntity.setStatus(FileEntity.FileStatus.AVAILABLE);
        fileEntity.setVirusScanStatus(FileEntity.VirusScanStatus.CLEAN);
        fileEntity.setFileSize(1024L);
        
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).getMessage().contains("至少需要上传2个文件"));
        assertEquals(AttachmentValidationResult.ErrorType.TOO_FEW_FILES, 
                result.getErrors().get(0).getErrorType());
    }
    
    @Test
    void testValidate_MaxFiles_TooMany() {
        // 准备数据
        UUID fileId1 = UUID.randomUUID();
        UUID fileId2 = UUID.randomUUID();
        UUID fileId3 = UUID.randomUUID();
        
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("photos")
                .fieldLabel("照片")
                .required(true)
                .maxFiles(2)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        attachments.put("photos", List.of(fileId1, fileId2, fileId3)); // 3个文件
        
        // Mock文件存在且可用
        for (UUID fileId : List.of(fileId1, fileId2, fileId3)) {
            FileEntity fileEntity = new FileEntity();
            fileEntity.setId(fileId);
            fileEntity.setOriginalName("photo.jpg");
            fileEntity.setStatus(FileEntity.FileStatus.AVAILABLE);
            fileEntity.setVirusScanStatus(FileEntity.VirusScanStatus.CLEAN);
            fileEntity.setFileSize(1024L);
            when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));
        }
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).getMessage().contains("最多只能上传2个文件"));
        assertEquals(AttachmentValidationResult.ErrorType.TOO_MANY_FILES, 
                result.getErrors().get(0).getErrorType());
    }
    
    // ========== 文件状态验证测试 ==========
    
    @Test
    void testValidate_FileNotFound() {
        // 准备数据
        UUID fileId = UUID.randomUUID();
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("idCard")
                .fieldLabel("身份证")
                .required(true)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        attachments.put("idCard", List.of(fileId));
        
        // Mock文件不存在
        when(fileRepository.findById(fileId)).thenReturn(Optional.empty());
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).getMessage().contains("文件不存在"));
        assertEquals(AttachmentValidationResult.ErrorType.FILE_NOT_FOUND, 
                result.getErrors().get(0).getErrorType());
    }
    
    @Test
    void testValidate_FileNotAvailable() {
        // 准备数据
        UUID fileId = UUID.randomUUID();
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("idCard")
                .fieldLabel("身份证")
                .required(true)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        attachments.put("idCard", List.of(fileId));
        
        // Mock文件状态为DELETED
        FileEntity fileEntity = new FileEntity();
        fileEntity.setId(fileId);
        fileEntity.setOriginalName("idcard.jpg");
        fileEntity.setStatus(FileEntity.FileStatus.DELETED);
        fileEntity.setVirusScanStatus(FileEntity.VirusScanStatus.CLEAN);
        
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).getMessage().contains("文件不可用"));
        assertEquals(AttachmentValidationResult.ErrorType.FILE_NOT_AVAILABLE, 
                result.getErrors().get(0).getErrorType());
    }
    
    @Test
    void testValidate_VirusScanInfected() {
        // 准备数据
        UUID fileId = UUID.randomUUID();
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("idCard")
                .fieldLabel("身份证")
                .required(true)
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        attachments.put("idCard", List.of(fileId));
        
        // Mock文件病毒扫描失败
        FileEntity fileEntity = new FileEntity();
        fileEntity.setId(fileId);
        fileEntity.setOriginalName("idcard.jpg");
        fileEntity.setStatus(FileEntity.FileStatus.AVAILABLE);
        fileEntity.setVirusScanStatus(FileEntity.VirusScanStatus.INFECTED);
        
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).getMessage().contains("未通过病毒扫描"));
        assertEquals(AttachmentValidationResult.ErrorType.VIRUS_SCAN_FAILED, 
                result.getErrors().get(0).getErrorType());
    }
    
    // ========== 文件类型验证测试 ==========
    
    @Test
    void testValidate_InvalidFileType() {
        // 准备数据
        UUID fileId = UUID.randomUUID();
        AttachmentRequirement requirement = AttachmentRequirement.builder()
                .fieldKey("idCard")
                .fieldLabel("身份证")
                .required(true)
                .allowedExtensions(List.of("jpg", "jpeg", "png"))
                .build();
        
        Map<String, List<UUID>> attachments = new HashMap<>();
        attachments.put("idCard", List.of(fileId));
        
        // Mock文件类型为PDF（不在允许列表中）
        FileEntity fileEntity = new FileEntity();
        fileEntity.setId(fileId);
        fileEntity.setOriginalName("idcard.pdf");
        fileEntity.setStatus(FileEntity.FileStatus.AVAILABLE);
        fileEntity.setVirusScanStatus(FileEntity.VirusScanStatus.CLEAN);
        fileEntity.setFileSize(1024L);
        
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));
        
        // 执行验证
        AttachmentValidationResult result = validationService.validate(
                attachments,
                List.of(requirement)
        );
        
        // 验证结果
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).getMessage().contains("文件类型不符合要求"));
        assertEquals(AttachmentValidationResult.ErrorType.INVALID_FILE_TYPE, 
                result.getErrors().get(0).getErrorType());
    }
}

