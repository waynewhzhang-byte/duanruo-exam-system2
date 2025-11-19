package com.duanruo.exam.infrastructure.service;

import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaFileRepository;
import com.duanruo.exam.shared.domain.TenantId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileServiceImplTest {

    @Mock
    private JpaFileRepository fileRepository;

    @Mock
    private com.duanruo.exam.infrastructure.storage.MinioFileStorageService minioService;

    @InjectMocks
    private FileServiceImpl fileService;

    private FileEntity testFile;
    private UUID testFileId;
    private UUID testTenantId;

    @BeforeEach
    void setUp() {
        testFileId = UUID.randomUUID();
        testTenantId = UUID.randomUUID();
        testFile = createTestFileEntity();

        // 设置租户上下文
        TenantContext.setCurrentTenant(TenantId.of(testTenantId));
    }

    @AfterEach
    void tearDown() {
        // 清理租户上下文
        TenantContext.clear();
    }

    @Test
    void shouldGenerateUploadUrl() {
        // Given
        when(minioService.getPresignedUploadUrl(anyString(), anyString()))
                .thenReturn("https://minio.example.com/upload-url");
        when(fileRepository.save(any(FileEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        var result = fileService.generateUploadUrl("resume.pdf", "application/pdf", "resume", "candidate1");

        // Then
        assertThat(result.getFileId()).isNotNull();
        assertThat(result.getUploadUrl()).isEqualTo("https://minio.example.com/upload-url");
        assertThat(result.getObjectKey()).contains("candidate1").contains("resume");

        verify(fileRepository).save(any(FileEntity.class));
        verify(minioService).getPresignedUploadUrl(anyString(), anyString());
    }

    @Test
    void shouldConfirmUpload() {
        // Given
        testFile.setStatus(FileEntity.FileStatus.UPLOADING);
        when(fileRepository.findById(testFileId)).thenReturn(Optional.of(testFile));
        when(fileRepository.save(any(FileEntity.class))).thenReturn(testFile);
        // 存储中存在该对象
        when(minioService.fileExists(anyString())).thenReturn(true);
        // Mock文件头读取（返回PDF文件头）
        byte[] pdfHeader = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0, 0, 0, 0, 0, 0, 0, 0};
        when(minioService.readFileHeader(anyString(), anyInt())).thenReturn(pdfHeader);

        // When
        fileService.confirmUpload(testFileId, 1024000L);

        // Then
        // 验证最后一次save调用的参数（状态应该是UPLOADED）
        verify(fileRepository, atLeastOnce()).save(argThat(file ->
            file.getStatus() == FileEntity.FileStatus.UPLOADED &&
            file.getFileSize().equals(1024000L)
        ));
    }

    @Test
    void shouldGetFileInfo() {
        // Given
        when(fileRepository.findById(testFileId)).thenReturn(Optional.of(testFile));

        // When
        var result = fileService.getFileInfo(testFileId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(testFileId);
        assertThat(result.get().getStoredName()).isEqualTo("resume.pdf");
        assertThat(result.get().getUploadedBy()).isEqualTo("candidate1");
    }

    @Test
    void shouldGetDownloadUrl() {
        // Given
        when(fileRepository.findById(testFileId)).thenReturn(Optional.of(testFile));
        when(minioService.getPresignedDownloadUrl(anyString()))
                .thenReturn("https://minio.example.com/download-url");

        // When
        var result = fileService.getDownloadUrl(testFileId, "candidate1");

        // Then
        assertThat(result).isEqualTo("https://minio.example.com/download-url");
        
        // Verify access tracking via updateAccessInfo call
        verify(fileRepository).updateAccessInfo(eq(testFileId), any(LocalDateTime.class));
    }

    @Test
    void shouldDeleteFile() {
        // Given
        when(fileRepository.findById(testFileId)).thenReturn(Optional.of(testFile));
        doNothing().when(minioService).deleteFile(anyString());
        when(fileRepository.save(any(FileEntity.class))).thenReturn(testFile);

        // When
        fileService.deleteFile(testFileId, "candidate1");

        // Then
        verify(minioService).deleteFile(anyString());
        verify(fileRepository).save(argThat(file -> 
            file.getStatus() == FileEntity.FileStatus.DELETED
        ));
    }

    @Test
    void shouldGetUserFiles() {
        // Given
        var files = List.of(testFile);
        var page = new PageImpl<>(files, PageRequest.of(0, 10), 1);
        when(fileRepository.findByUploadedByAndStatus(
                eq("candidate1"), eq(FileEntity.FileStatus.AVAILABLE), any()))
                .thenReturn(page);

        // When
        var result = fileService.getUserFiles("candidate1", FileEntity.FileStatus.AVAILABLE, PageRequest.of(0, 10));

        // Then
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStoredName()).isEqualTo("resume.pdf");
    }

    @Test
    void shouldGetUserFilesWithoutStatusFilter() {
        // Given
        var files = List.of(testFile);
        var page = new PageImpl<>(files, PageRequest.of(0, 10), 1);
        when(fileRepository.findByUploadedBy(eq("candidate1"), any()))
                .thenReturn(page);

        // When
        var result = fileService.getUserFiles("candidate1", null, PageRequest.of(0, 10));

        // Then
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void shouldGetBatchFileInfo() {
        // Given
        var fileIds = List.of(testFileId);
        when(fileRepository.findAllById(fileIds)).thenReturn(List.of(testFile));

        // When
        var result = fileService.getBatchFileInfo(fileIds);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(testFileId);
    }

    @Test
    void shouldValidateFileType() {
        // Given
        var allowedTypes = List.of("pdf", "doc", "docx", "jpg", "jpeg", "png");

        // When & Then
        assertThat(fileService.validateFileType("resume.pdf", "application/pdf", allowedTypes)).isTrue();
        assertThat(fileService.validateFileType("document.doc", "application/msword", allowedTypes)).isTrue();
        assertThat(fileService.validateFileType("image.jpg", "image/jpeg", allowedTypes)).isTrue();
        assertThat(fileService.validateFileType("malware.exe", "application/octet-stream", allowedTypes)).isFalse();
        assertThat(fileService.validateFileType("script.js", "application/javascript", allowedTypes)).isFalse();
    }

    @Test
    void shouldValidateFileTypeByExtension() {
        // Given
        var allowedTypes = List.of("pdf");

        // When & Then - 测试不同的文件扩展名格式
        assertThat(fileService.validateFileType("resume.PDF", "application/pdf", allowedTypes)).isTrue();
        assertThat(fileService.validateFileType("resume.Pdf", "application/pdf", allowedTypes)).isTrue();
        assertThat(fileService.validateFileType("resume", "application/pdf", allowedTypes)).isFalse(); // 无扩展名
    }

    private FileEntity createTestFileEntity() {
        var file = new FileEntity();
        file.setId(testFileId);
        file.setStoredName("resume.pdf");
        file.setOriginalName("张三_简历.pdf");
        file.setContentType("application/pdf");
        file.setFileSize(1024000L);
        file.setStatus(FileEntity.FileStatus.AVAILABLE);
        file.setVirusScanStatus(FileEntity.VirusScanStatus.PENDING);
        file.setFieldKey("resume");
        file.setUploadedBy("candidate1");
        // 设置对象键，包含租户ID以通过租户验证
        file.setObjectKey("tenants/" + testTenantId + "/uploads/candidate1/resume/" + testFileId + ".pdf");
        file.setCreatedAt(LocalDateTime.now());
        file.setUpdatedAt(LocalDateTime.now());
        file.setAccessCount(0);
        return file;
    }
}
