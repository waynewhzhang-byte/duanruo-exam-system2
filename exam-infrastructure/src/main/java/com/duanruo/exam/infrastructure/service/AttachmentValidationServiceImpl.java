package com.duanruo.exam.infrastructure.service;

import com.duanruo.exam.domain.file.AttachmentRequirement;
import com.duanruo.exam.domain.file.AttachmentValidationResult;
import com.duanruo.exam.domain.file.AttachmentValidationResult.ValidationError;
import com.duanruo.exam.domain.file.AttachmentValidationResult.ErrorType;
import com.duanruo.exam.domain.file.AttachmentValidationService;
import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaFileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 附件验证服务实现
 */
@Service
public class AttachmentValidationServiceImpl implements AttachmentValidationService {
    
    private static final Logger log = LoggerFactory.getLogger(AttachmentValidationServiceImpl.class);
    
    private final JpaFileRepository fileRepository;
    
    public AttachmentValidationServiceImpl(JpaFileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }
    
    @Override
    public AttachmentValidationResult validate(
            Map<String, List<UUID>> attachments,
            List<AttachmentRequirement> requirements) {
        
        List<ValidationError> errors = new ArrayList<>();
        
        for (AttachmentRequirement requirement : requirements) {
            String fieldKey = requirement.getFieldKey();
            List<UUID> fileIds = attachments != null ? attachments.get(fieldKey) : null;
            
            AttachmentValidationResult fieldResult = validateField(fieldKey, fileIds, requirement);
            if (!fieldResult.isValid()) {
                errors.addAll(fieldResult.getErrors());
            }
        }
        
        if (errors.isEmpty()) {
            return AttachmentValidationResult.success();
        }
        
        return AttachmentValidationResult.failure(errors);
    }
    
    @Override
    public AttachmentValidationResult validateField(
            String fieldKey,
            List<UUID> fileIds,
            AttachmentRequirement requirement) {
        
        List<ValidationError> errors = new ArrayList<>();
        String fieldLabel = requirement.getFieldLabel() != null ? requirement.getFieldLabel() : fieldKey;
        
        // 1. 检查是否为必填
        if (requirement.isRequired() && (fileIds == null || fileIds.isEmpty())) {
            errors.add(new ValidationError(
                    fieldKey,
                    fieldLabel,
                    ErrorType.MISSING_REQUIRED,
                    String.format("缺少必需附件: %s", fieldLabel)
            ));
            return AttachmentValidationResult.failure(errors);
        }
        
        // 如果不是必填且没有文件，则通过验证
        if (fileIds == null || fileIds.isEmpty()) {
            return AttachmentValidationResult.success();
        }
        
        // 2. 检查文件数量
        int fileCount = fileIds.size();
        
        if (requirement.getMinFiles() != null && fileCount < requirement.getMinFiles()) {
            errors.add(new ValidationError(
                    fieldKey,
                    fieldLabel,
                    ErrorType.TOO_FEW_FILES,
                    String.format("%s: 至少需要上传%d个文件，当前只有%d个", 
                            fieldLabel, requirement.getMinFiles(), fileCount)
            ));
        }
        
        if (requirement.getMaxFiles() != null && fileCount > requirement.getMaxFiles()) {
            errors.add(new ValidationError(
                    fieldKey,
                    fieldLabel,
                    ErrorType.TOO_MANY_FILES,
                    String.format("%s: 最多只能上传%d个文件，当前有%d个", 
                            fieldLabel, requirement.getMaxFiles(), fileCount)
            ));
        }
        
        // 3. 验证每个文件
        for (UUID fileId : fileIds) {
            ValidationError fileError = validateSingleFile(fileId, requirement);
            if (fileError != null) {
                errors.add(fileError);
            }
        }
        
        if (errors.isEmpty()) {
            return AttachmentValidationResult.success();
        }
        
        return AttachmentValidationResult.failure(errors);
    }
    
    /**
     * 验证单个文件
     */
    private ValidationError validateSingleFile(UUID fileId, AttachmentRequirement requirement) {
        String fieldKey = requirement.getFieldKey();
        String fieldLabel = requirement.getFieldLabel() != null ? requirement.getFieldLabel() : fieldKey;
        
        // 1. 检查文件是否存在
        Optional<FileEntity> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isEmpty()) {
            return new ValidationError(
                    fieldKey,
                    fieldLabel,
                    ErrorType.FILE_NOT_FOUND,
                    String.format("%s: 文件不存在 (ID: %s)", fieldLabel, fileId)
            );
        }
        
        FileEntity file = fileOpt.get();
        
        // 2. 检查文件状态
        if (file.getStatus() != FileEntity.FileStatus.AVAILABLE) {
            return new ValidationError(
                    fieldKey,
                    fieldLabel,
                    ErrorType.FILE_NOT_AVAILABLE,
                    String.format("%s: 文件不可用 (%s, 状态: %s)", 
                            fieldLabel, file.getOriginalName(), file.getStatus())
            );
        }
        
        // 3. 检查病毒扫描状态
        if (file.getVirusScanStatus() == FileEntity.VirusScanStatus.INFECTED) {
            return new ValidationError(
                    fieldKey,
                    fieldLabel,
                    ErrorType.VIRUS_SCAN_FAILED,
                    String.format("%s: 文件未通过病毒扫描 (%s)", fieldLabel, file.getOriginalName())
            );
        }
        
        if (file.getVirusScanStatus() == FileEntity.VirusScanStatus.PENDING) {
            return new ValidationError(
                    fieldKey,
                    fieldLabel,
                    ErrorType.VIRUS_SCAN_PENDING,
                    String.format("%s: 文件正在进行病毒扫描 (%s)", fieldLabel, file.getOriginalName())
            );
        }
        
        // 4. 检查文件大小
        if (requirement.getMaxFileSize() != null && file.getFileSize() != null) {
            if (file.getFileSize() > requirement.getMaxFileSize()) {
                return new ValidationError(
                        fieldKey,
                        fieldLabel,
                        ErrorType.FILE_TOO_LARGE,
                        String.format("%s: 文件大小超过限制 (%s, 大小: %.2fMB, 限制: %.2fMB)", 
                                fieldLabel, 
                                file.getOriginalName(),
                                file.getFileSize() / 1024.0 / 1024.0,
                                requirement.getMaxFileSize() / 1024.0 / 1024.0)
                );
            }
        }
        
        // 5. 检查文件类型
        if (requirement.getAllowedExtensions() != null && !requirement.getAllowedExtensions().isEmpty()) {
            String extension = getFileExtension(file.getOriginalName());
            if (extension != null && !requirement.getAllowedExtensions().contains(extension.toLowerCase())) {
                return new ValidationError(
                        fieldKey,
                        fieldLabel,
                        ErrorType.INVALID_FILE_TYPE,
                        String.format("%s: 文件类型不符合要求 (%s, 允许的类型: %s)", 
                                fieldLabel, 
                                file.getOriginalName(),
                                String.join(", ", requirement.getAllowedExtensions()))
                );
            }
        }
        
        return null;
    }
    
    @Override
    public FileInfo getFileInfo(UUID fileId) {
        Optional<FileEntity> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isEmpty()) {
            return null;
        }
        
        FileEntity file = fileOpt.get();
        return new FileInfo(
                file.getId(),
                file.getOriginalName(),
                file.getContentType(),
                file.getFileSize(),
                mapFileStatus(file.getStatus()),
                mapVirusScanStatus(file.getVirusScanStatus()),
                file.getFieldKey()
        );
    }
    
    private FileStatus mapFileStatus(FileEntity.FileStatus status) {
        if (status == null) {
            return FileStatus.UPLOADING;
        }
        return switch (status) {
            case UPLOADING -> FileStatus.UPLOADING;
            case UPLOADED, AVAILABLE -> FileStatus.AVAILABLE;
            case DELETED, QUARANTINED -> FileStatus.DELETED;
            case EXPIRED -> FileStatus.EXPIRED;
        };
    }
    
    private VirusScanStatus mapVirusScanStatus(FileEntity.VirusScanStatus status) {
        if (status == null) {
            return VirusScanStatus.PENDING;
        }
        return switch (status) {
            case PENDING, SCANNING -> VirusScanStatus.PENDING;
            case CLEAN, SKIPPED -> VirusScanStatus.CLEAN;
            case INFECTED -> VirusScanStatus.INFECTED;
            case FAILED -> VirusScanStatus.ERROR;
        };
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return null;
        }
        
        return filename.substring(lastDotIndex + 1);
    }
}

