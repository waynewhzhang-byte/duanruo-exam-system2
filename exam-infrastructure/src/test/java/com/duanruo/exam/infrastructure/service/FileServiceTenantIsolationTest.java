package com.duanruo.exam.infrastructure.service;

import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaFileRepository;
import com.duanruo.exam.infrastructure.storage.MinioFileStorageService;
import com.duanruo.exam.shared.domain.TenantId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * 文件服务租户隔离测试
 * 验证文件上传、下载、删除等操作的租户隔离机制
 */
@ExtendWith(MockitoExtension.class)
class FileServiceTenantIsolationTest {

    @Mock
    private JpaFileRepository fileRepository;

    @Mock
    private MinioFileStorageService storageService;

    private FileServiceImpl fileService;

    private TenantId tenantA;
    private TenantId tenantB;

    @BeforeEach
    void setUp() {
        fileService = new FileServiceImpl(fileRepository, storageService);
        tenantA = TenantId.of(UUID.randomUUID());
        tenantB = TenantId.of(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldIncludeTenantIdInObjectKey() {
        // Given
        TenantContext.setCurrentTenant(tenantA);
        when(storageService.getPresignedUploadUrl(anyString(), anyString()))
                .thenReturn("http://minio/presigned-url");
        when(fileRepository.save(any(FileEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        FileServiceImpl.FileUploadInfo uploadInfo = fileService.generateUploadUrl(
                "test.pdf",
                "application/pdf",
                "resume",
                "user-123"
        );

        // Then
        assertNotNull(uploadInfo);
        assertTrue(uploadInfo.getObjectKey().startsWith("tenants/" + tenantA.getValue().toString() + "/"),
                "Object key should start with tenant ID: " + uploadInfo.getObjectKey());
        assertTrue(uploadInfo.getObjectKey().contains("uploads/user-123/resume/"),
                "Object key should contain user and field key");
    }

    @Test
    void shouldThrowExceptionWhenNoTenantContext() {
        // Given
        TenantContext.clear();

        // When & Then
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            fileService.generateUploadUrl(
                    "test.pdf",
                    "application/pdf",
                    "resume",
                    "user-123"
            );
        });

        assertEquals("No tenant context available for file upload", exception.getMessage());
    }

    @Test
    void shouldPreventCrossTenantFileDownload() {
        // Given
        UUID fileId = UUID.randomUUID();
        String tenantAObjectKey = "tenants/" + tenantA.getValue() + "/uploads/user-123/resume/file.pdf";
        
        FileEntity fileEntity = new FileEntity(
                fileId,
                "test.pdf",
                "file.pdf",
                tenantAObjectKey,
                "application/pdf",
                "user-123"
        );
        fileEntity.setStatus(FileEntity.FileStatus.UPLOADED);

        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));

        // 租户 A 上传的文件
        TenantContext.setCurrentTenant(tenantA);
        when(storageService.getPresignedDownloadUrl(anyString()))
                .thenReturn("http://minio/download-url");

        // 租户 A 可以访问
        String downloadUrl = fileService.getDownloadUrl(fileId, "user-123");
        assertNotNull(downloadUrl);

        // 租户 B 尝试访问租户 A 的文件
        TenantContext.setCurrentTenant(tenantB);

        // When & Then
        SecurityException exception = assertThrows(SecurityException.class, () -> {
            fileService.getDownloadUrl(fileId, "user-456");
        });

        assertEquals("File does not belong to current tenant", exception.getMessage());
    }

    @Test
    void shouldPreventCrossTenantFileDelete() {
        // Given
        UUID fileId = UUID.randomUUID();
        String tenantAObjectKey = "tenants/" + tenantA.getValue() + "/uploads/user-123/resume/file.pdf";
        
        FileEntity fileEntity = new FileEntity(
                fileId,
                "test.pdf",
                "file.pdf",
                tenantAObjectKey,
                "application/pdf",
                "user-123"
        );
        fileEntity.setStatus(FileEntity.FileStatus.UPLOADED);

        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));

        // 租户 B 尝试删除租户 A 的文件
        TenantContext.setCurrentTenant(tenantB);

        // When & Then
        SecurityException exception = assertThrows(SecurityException.class, () -> {
            fileService.deleteFile(fileId, "user-456");
        });

        assertEquals("File does not belong to current tenant", exception.getMessage());
        verify(storageService, never()).deleteFile(anyString());
    }

    @Test
    void shouldAllowSameTenantFileOperations() {
        // Given
        UUID fileId = UUID.randomUUID();
        String tenantAObjectKey = "tenants/" + tenantA.getValue() + "/uploads/user-123/resume/file.pdf";
        
        FileEntity fileEntity = new FileEntity(
                fileId,
                "test.pdf",
                "file.pdf",
                tenantAObjectKey,
                "application/pdf",
                "user-123"
        );
        fileEntity.setStatus(FileEntity.FileStatus.UPLOADED);

        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));
        when(storageService.getPresignedDownloadUrl(anyString()))
                .thenReturn("http://minio/download-url");
        doNothing().when(storageService).deleteFile(anyString());
        when(fileRepository.save(any(FileEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // 租户 A 的操作
        TenantContext.setCurrentTenant(tenantA);

        // When - 下载文件
        String downloadUrl = fileService.getDownloadUrl(fileId, "user-123");

        // Then
        assertNotNull(downloadUrl);
        verify(storageService).getPresignedDownloadUrl(tenantAObjectKey);

        // When - 删除文件
        fileService.deleteFile(fileId, "user-123");

        // Then
        verify(storageService).deleteFile(tenantAObjectKey);
        verify(fileRepository).save(argThat(entity -> 
            entity.getStatus() == FileEntity.FileStatus.DELETED
        ));
    }

    @Test
    void shouldIsolateTenantFilesInDifferentPaths() {
        // Given
        TenantContext.setCurrentTenant(tenantA);
        when(storageService.getPresignedUploadUrl(anyString(), anyString()))
                .thenReturn("http://minio/presigned-url-a");
        when(fileRepository.save(any(FileEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When - 租户 A 上传文件
        FileServiceImpl.FileUploadInfo uploadInfoA = fileService.generateUploadUrl(
                "resume.pdf",
                "application/pdf",
                "resume",
                "user-123"
        );

        // 切换到租户 B
        TenantContext.setCurrentTenant(tenantB);
        when(storageService.getPresignedUploadUrl(anyString(), anyString()))
                .thenReturn("http://minio/presigned-url-b");

        // When - 租户 B 上传同名文件
        FileServiceImpl.FileUploadInfo uploadInfoB = fileService.generateUploadUrl(
                "resume.pdf",
                "application/pdf",
                "resume",
                "user-123"  // 相同的用户 ID
        );

        // Then - 两个文件应该在不同的路径
        assertNotEquals(uploadInfoA.getObjectKey(), uploadInfoB.getObjectKey(),
                "Files from different tenants should have different object keys");
        assertTrue(uploadInfoA.getObjectKey().contains(tenantA.getValue().toString()),
                "Tenant A file should contain tenant A ID");
        assertTrue(uploadInfoB.getObjectKey().contains(tenantB.getValue().toString()),
                "Tenant B file should contain tenant B ID");
    }

    @Test
    void shouldThrowExceptionWhenDownloadingWithoutTenantContext() {
        // Given
        UUID fileId = UUID.randomUUID();
        FileEntity fileEntity = new FileEntity(
                fileId,
                "test.pdf",
                "file.pdf",
                "tenants/some-tenant/uploads/user-123/resume/file.pdf",
                "application/pdf",
                "user-123"
        );
        fileEntity.setStatus(FileEntity.FileStatus.UPLOADED);

        when(fileRepository.findById(fileId)).thenReturn(Optional.of(fileEntity));

        // 清除租户上下文
        TenantContext.clear();

        // When & Then
        SecurityException exception = assertThrows(SecurityException.class, () -> {
            fileService.getDownloadUrl(fileId, "user-123");
        });

        assertEquals("No tenant context available", exception.getMessage());
    }
}

