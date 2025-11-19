package com.duanruo.exam.domain.file;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 附件验证服务接口（Port）
 * 由Infrastructure层实现
 */
public interface AttachmentValidationService {
    
    /**
     * 验证附件是否满足要求
     * 
     * @param attachments 提交的附件列表（fieldKey -> fileIds）
     * @param requirements 附件要求列表
     * @return 验证结果
     */
    AttachmentValidationResult validate(
            Map<String, List<UUID>> attachments,
            List<AttachmentRequirement> requirements
    );
    
    /**
     * 验证单个附件字段
     * 
     * @param fieldKey 字段键
     * @param fileIds 文件ID列表
     * @param requirement 附件要求
     * @return 验证结果
     */
    AttachmentValidationResult validateField(
            String fieldKey,
            List<UUID> fileIds,
            AttachmentRequirement requirement
    );
    
    /**
     * 获取文件信息
     * 
     * @param fileId 文件ID
     * @return 文件信息
     */
    FileInfo getFileInfo(UUID fileId);
    
    /**
     * 文件信息
     */
    record FileInfo(
            UUID id,
            String originalName,
            String contentType,
            Long fileSize,
            FileStatus status,
            VirusScanStatus virusScanStatus,
            String fieldKey
    ) {}
    
    /**
     * 文件状态
     */
    enum FileStatus {
        UPLOADING,
        AVAILABLE,
        DELETED,
        EXPIRED
    }
    
    /**
     * 病毒扫描状态
     */
    enum VirusScanStatus {
        PENDING,
        CLEAN,
        INFECTED,
        ERROR
    }
}

