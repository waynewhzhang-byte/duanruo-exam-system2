package com.duanruo.exam.infrastructure.service;

import com.duanruo.exam.domain.file.FileValidator;
import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaFileRepository;
import com.duanruo.exam.infrastructure.storage.MinioFileStorageService;
import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import com.duanruo.exam.shared.domain.TenantId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 文件服务实现
 */
@Service
@Transactional
public class FileServiceImpl {

    private static final Logger logger = LoggerFactory.getLogger(FileServiceImpl.class);

    private final JpaFileRepository fileRepository;
    private final MinioFileStorageService storageService;

    public FileServiceImpl(JpaFileRepository fileRepository, MinioFileStorageService storageService) {
        this.fileRepository = fileRepository;
        this.storageService = storageService;
    }

    /**
     * 生成文件上传URL
     */
    public FileUploadInfo generateUploadUrl(String originalName, String contentType,
                                          String fieldKey, String uploadedBy) {
        // 获取当前租户 ID
        TenantId tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant context available for file upload");
        }

        // 1. 验证文件名安全性
        FileValidator.ValidationResult fileNameResult = FileValidator.validateFileName(originalName);
        if (!fileNameResult.isValid()) {
            logger.warn("File name validation failed: {}", fileNameResult.getErrorMessage());
            throw new IllegalArgumentException(fileNameResult.getErrorMessage());
        }

        // 2. 验证文件扩展名
        FileValidator.ValidationResult extensionResult = FileValidator.validateFileExtension(originalName);
        if (!extensionResult.isValid()) {
            logger.warn("File extension validation failed: {}", extensionResult.getErrorMessage());
            throw new IllegalArgumentException(extensionResult.getErrorMessage());
        }

        // 3. 验证内容类型
        FileValidator.ValidationResult contentTypeResult = FileValidator.validateContentType(contentType, originalName);
        if (!contentTypeResult.isValid()) {
            logger.warn("Content type validation failed: {}", contentTypeResult.getErrorMessage());
            throw new IllegalArgumentException(contentTypeResult.getErrorMessage());
        }

        UUID fileId = UUID.randomUUID();
        String fileExtension = getFileExtension(originalName);
        String storedName = generateStoredName(fileId, fileExtension);

        // 生成包含租户 ID 的对象键
        String objectKey = generateObjectKey(tenantId.getValue().toString(), uploadedBy, fieldKey, storedName);

        // 创建文件记录
        FileEntity fileEntity = new FileEntity(fileId, originalName, storedName, objectKey, contentType, uploadedBy);
        fileEntity.setFieldKey(fieldKey);
        fileEntity.setStatus(FileEntity.FileStatus.UPLOADING);
        fileRepository.save(fileEntity);

        // 生成预签名上传URL
        String uploadUrl = storageService.getPresignedUploadUrl(objectKey, contentType);

        logger.info("Generated upload URL for file: {} ({}) in tenant: {}", originalName, fileId, tenantId.getValue());

        return new FileUploadInfo(fileId, uploadUrl, objectKey, storedName);
    }

    /**
     * 确认文件上传完成
     */
    public void confirmUpload(UUID fileId, Long fileSize) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        if (fileEntity.getStatus() != FileEntity.FileStatus.UPLOADING) {
            throw new RuntimeException("File is not in uploading status: " + fileId);
        }

        // 验证文件是否真的存在于MinIO中
        if (!storageService.fileExists(fileEntity.getObjectKey())) {
            throw new RuntimeException("File not found in storage: " + fileEntity.getObjectKey());
        }

        // 1. 验证文件大小
        FileValidator.ValidationResult sizeResult = FileValidator.validateFileSize(fileSize);
        if (!sizeResult.isValid()) {
            logger.warn("File size validation failed: {}", sizeResult.getErrorMessage());
            // 删除已上传的文件
            try {
                storageService.deleteFile(fileEntity.getObjectKey());
            } catch (Exception e) {
                logger.error("Failed to delete invalid file: {}", fileEntity.getObjectKey(), e);
            }
            fileEntity.setStatus(FileEntity.FileStatus.DELETED);
            fileRepository.save(fileEntity);
            throw new IllegalArgumentException(sizeResult.getErrorMessage());
        }

        // 2. 验证文件Magic Number（文件头）
        try {
            byte[] fileHeader = storageService.readFileHeader(fileEntity.getObjectKey(), 16);
            FileValidator.ValidationResult magicResult = FileValidator.validateMagicNumber(fileHeader, fileEntity.getOriginalName());
            if (!magicResult.isValid()) {
                logger.warn("Magic number validation failed: {}", magicResult.getErrorMessage());
                // 删除已上传的文件
                try {
                    storageService.deleteFile(fileEntity.getObjectKey());
                } catch (Exception e) {
                    logger.error("Failed to delete invalid file: {}", fileEntity.getObjectKey(), e);
                }
                fileEntity.setStatus(FileEntity.FileStatus.DELETED);
                fileRepository.save(fileEntity);
                throw new IllegalArgumentException(magicResult.getErrorMessage());
            }
        } catch (Exception e) {
            logger.error("Failed to read file header for validation: {}", fileEntity.getObjectKey(), e);
            // 继续处理，不因为无法读取文件头而失败
        }

        // 更新文件状态
        fileEntity.setFileSize(fileSize);
        fileEntity.setStatus(FileEntity.FileStatus.UPLOADED);
        fileRepository.save(fileEntity);

        logger.info("Confirmed upload for file: {} ({})", fileEntity.getOriginalName(), fileId);
    }

    /**
     * 获取文件信息
     */
    @Transactional(readOnly = true)
    public Optional<FileEntity> getFileInfo(UUID fileId) {
        return fileRepository.findById(fileId);
    }

    /**
     * 获取文件下载URL
     */
    public String getDownloadUrl(UUID fileId, String requestedBy) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        if (fileEntity.getStatus() != FileEntity.FileStatus.AVAILABLE &&
            fileEntity.getStatus() != FileEntity.FileStatus.UPLOADED) {
            throw new RuntimeException("File is not available for download: " + fileId);
        }

        // 验证租户上下文
        validateTenantAccess(fileEntity);

        // 更新访问信息
        fileRepository.updateAccessInfo(fileId, LocalDateTime.now());

        // 生成下载URL
        String downloadUrl = storageService.getPresignedDownloadUrl(fileEntity.getObjectKey());

        logger.info("Generated download URL for file: {} requested by: {}", fileEntity.getOriginalName(), requestedBy);

        return downloadUrl;
    }

    /**
     * 删除文件
     */
    public void deleteFile(UUID fileId, String deletedBy) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        // 验证租户上下文
        validateTenantAccess(fileEntity);

        // 从存储中删除文件
        try {
            storageService.deleteFile(fileEntity.getObjectKey());
        } catch (Exception e) {
            logger.warn("Failed to delete file from storage: {}", fileEntity.getObjectKey(), e);
        }

        // 更新数据库状态
        fileEntity.setStatus(FileEntity.FileStatus.DELETED);
        fileRepository.save(fileEntity);

        logger.info("Deleted file: {} by: {}", fileEntity.getOriginalName(), deletedBy);
    }

    /**
     * 获取用户文件列表
     */
    @Transactional(readOnly = true)
    public Page<FileEntity> getUserFiles(String uploadedBy, FileEntity.FileStatus status, Pageable pageable) {
        if (status != null) {
            return fileRepository.findByUploadedByAndStatus(uploadedBy, status, pageable);
        } else {
            return fileRepository.findByUploadedBy(uploadedBy, pageable);
        }
    }

    /**
     * 获取申请相关文件
     */
    @Transactional(readOnly = true)
    public List<FileEntity> getApplicationFiles(UUID applicationId) {
        return fileRepository.findByApplicationId(applicationId);
    }

    /**
     * 关联文件到申请
     */
    public void associateFileWithApplication(UUID fileId, UUID applicationId) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        fileEntity.setApplicationId(applicationId);
        fileEntity.setStatus(FileEntity.FileStatus.AVAILABLE);
        fileRepository.save(fileEntity);

        logger.info("Associated file {} with application {}", fileId, applicationId);
    }

    /**
     * 批量获取文件信息
     */
    @Transactional(readOnly = true)
    public List<FileEntity> getBatchFileInfo(List<UUID> fileIds) {
        return fileRepository.findAllById(fileIds);
    }

    /**
     * 验证文件类型
     */
    public boolean validateFileType(String fileName, String contentType, List<String> allowedTypes) {
        if (allowedTypes == null || allowedTypes.isEmpty()) {
            return true;
        }

        String extension = getFileExtension(fileName).toLowerCase();
        return allowedTypes.contains(extension) || allowedTypes.contains(contentType);
    }

    /**
     * 生成存储文件名
     */
    private String generateStoredName(UUID fileId, String extension) {
        return fileId.toString() + (extension.isEmpty() ? "" : "." + extension);
    }

    /**
     * 生成对象键（包含租户隔离）
     * 格式: tenants/{tenantId}/uploads/{uploadedBy}/{fieldKey}/{storedName}
     */
    private String generateObjectKey(String tenantId, String uploadedBy, String fieldKey, String storedName) {
        return String.format("tenants/%s/uploads/%s/%s/%s", tenantId, uploadedBy, fieldKey, storedName);
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    /**
     * 验证租户访问权限
     * 确保文件的对象键包含当前租户 ID，防止跨租户访问
     */
    private void validateTenantAccess(FileEntity fileEntity) {
        TenantId currentTenant = TenantContext.getCurrentTenant();
        if (currentTenant == null) {
            throw new SecurityException("No tenant context available");
        }

        // 验证对象键包含正确的租户 ID
        String expectedPrefix = "tenants/" + currentTenant.getValue().toString() + "/";
        if (!fileEntity.getObjectKey().startsWith(expectedPrefix)) {
            logger.warn("Attempted cross-tenant file access. File: {}, Current Tenant: {}, Object Key: {}",
                       fileEntity.getId(), currentTenant.getValue(), fileEntity.getObjectKey());
            throw new SecurityException("File does not belong to current tenant");
        }
    }

    /**
     * 文件上传信息
     */
    public static class FileUploadInfo {
        private final UUID fileId;
        private final String uploadUrl;
        private final String objectKey;
        private final String storedName;

        public FileUploadInfo(UUID fileId, String uploadUrl, String objectKey, String storedName) {
            this.fileId = fileId;
            this.uploadUrl = uploadUrl;
            this.objectKey = objectKey;
            this.storedName = storedName;
        }

        public UUID getFileId() { return fileId; }
        public String getUploadUrl() { return uploadUrl; }
        public String getObjectKey() { return objectKey; }
        public String getStoredName() { return storedName; }
    }
}
