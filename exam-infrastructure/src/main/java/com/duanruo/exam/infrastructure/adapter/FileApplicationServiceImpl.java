package com.duanruo.exam.infrastructure.adapter;

import com.duanruo.exam.application.dto.file.*;
import com.duanruo.exam.application.service.FileApplicationService;
import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaFileRepository;
import com.duanruo.exam.infrastructure.service.FileServiceImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FileApplicationServiceImpl implements FileApplicationService {

    private final FileServiceImpl fileService;
    private final JpaFileRepository fileRepository;
    private final com.duanruo.exam.domain.application.ApplicationRepository applicationRepository;
    private final com.duanruo.exam.domain.application.ApplicationAuditLogRepository auditLogRepository;
    private final com.duanruo.exam.domain.review.ReviewTaskRepository reviewTaskRepository;
    private final com.duanruo.exam.domain.user.UserRepository userRepository;

    public FileApplicationServiceImpl(FileServiceImpl fileService,
                                      JpaFileRepository fileRepository,
                                      com.duanruo.exam.domain.application.ApplicationRepository applicationRepository,
                                      com.duanruo.exam.domain.application.ApplicationAuditLogRepository auditLogRepository,
                                      com.duanruo.exam.domain.review.ReviewTaskRepository reviewTaskRepository,
                                      com.duanruo.exam.domain.user.UserRepository userRepository) {
        this.fileService = fileService;
        this.fileRepository = fileRepository;
        this.applicationRepository = applicationRepository;
        this.auditLogRepository = auditLogRepository;
        this.reviewTaskRepository = reviewTaskRepository;
        this.userRepository = userRepository;
    }

    @Override
    public FileUploadUrlResponse generateUploadUrl(FileUploadUrlRequest req, String uploadedBy) {
        var info = fileService.generateUploadUrl(req.fileName(), req.contentType(), req.fieldKey(), uploadedBy);
        return new FileUploadUrlResponse(info.getFileId(), info.getUploadUrl(), info.getObjectKey(),
                req.fileName(), req.contentType(), req.fieldKey(), 3600);
    }

    @Override
    public void confirmUpload(UUID fileId, long fileSize) {
        fileService.confirmUpload(fileId, fileSize);
    }

    @Override
    public FileInfoResponse getFile(UUID fileId) {
        var e = fileService.getFileInfo(fileId).orElseThrow(() -> new RuntimeException("File not found: " + fileId));
        return toDto(e);
    }

    @Override
    public PresignedUrlResponse getDownloadUrl(UUID fileId, String requestedBy) {
        var e = fileService.getFileInfo(fileId).orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        // 权限判定：
        boolean permitted = true;
        String denyReason = null;
        java.util.UUID requesterId = null;
        try { requesterId = java.util.UUID.fromString(requestedBy); } catch (Exception ex) { /* ignore */ }

        if (e.getApplicationId() != null) {
            permitted = false; // 证据文件默认需要显式授权
            var appOpt = applicationRepository.findById(com.duanruo.exam.domain.application.ApplicationId.of(e.getApplicationId()));
            var app = appOpt.orElse(null);
            if (app == null) {
                denyReason = "application-not-found";
            } else if (requesterId != null) {
                // 1) ADMIN 允许
                var userOpt = userRepository.findById(com.duanruo.exam.domain.user.UserId.of(requestedBy));
                var user = userOpt.orElse(null);
                boolean isAdmin = user != null && user.hasRole(com.duanruo.exam.domain.user.Role.ADMIN);
                if (isAdmin) {
                    permitted = true;
                }
                // 2) 申请人本人允许
                if (!permitted && java.util.Objects.equals(app.getCandidateId().getValue(), requesterId)) {
                    permitted = true;
                }
                // 3) 当前被分配的审核员允许（任一阶段）
                if (!permitted) {
                    var tasks = reviewTaskRepository.findAssignedTo(requesterId);
                    permitted = tasks.stream().anyMatch(t ->
                            java.util.Objects.equals(t.getApplicationId().getValue(), app.getId().getValue())
                                    && t.getStatus() == com.duanruo.exam.domain.review.ReviewTaskStatus.ASSIGNED
                    );
                    if (!permitted) {
                        denyReason = "not-assignee";
                    }
                }
            } else {
                denyReason = "invalid-requester-id";
            }
        }

        if (!permitted) {
            // 审计拒绝
            auditEvidenceAccess(e, fileId, requestedBy, false, denyReason);
            throw new com.duanruo.exam.shared.exception.ApplicationException("FORBIDDEN_EVIDENCE_ACCESS", "无权访问该证据");
        }

        var url = fileService.getDownloadUrl(fileId, requestedBy);
        // 审计：证据下载访问（允许）
        auditEvidenceAccess(e, fileId, requestedBy, true, null);
        return new PresignedUrlResponse(fileId, url, 1800, e.getStoredName(), e.getContentType(), e.getFileSize());
    }

    private void auditEvidenceAccess(FileEntity e, UUID fileId, String requestedBy, boolean permitted, String denyReason) {
        if (e.getApplicationId() != null) {
            try {
                var app = applicationRepository.findById(com.duanruo.exam.domain.application.ApplicationId.of(e.getApplicationId())).orElse(null);
                com.duanruo.exam.domain.application.ApplicationStatus status = app != null ? app.getStatus() : com.duanruo.exam.domain.application.ApplicationStatus.SUBMITTED;
                java.util.Map<String, Object> meta = new java.util.HashMap<>();
                meta.put("fileId", fileId.toString());
                meta.put("requestedBy", requestedBy);
                meta.put("action", "evidence-download-url");
                meta.put("permitted", permitted);
                if (denyReason != null) meta.put("denyReason", denyReason);
                String metadata = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(meta);

                auditLogRepository.record(
                        com.duanruo.exam.domain.application.ApplicationId.of(e.getApplicationId()),
                        status,
                        status,
                        requestedBy,
                        "evidence-download",
                        metadata,
                        java.time.LocalDateTime.now()
                );
            } catch (Exception ignore) { /* non-blocking audit */ }
        }
    }

    @Override
    public void deleteFile(UUID fileId, String deletedBy) {
        fileService.deleteFile(fileId, deletedBy);
    }

    @Override
    public Page<FileInfoResponse> getMyFiles(String uploadedBy, String status, Pageable pageable) {
        FileEntity.FileStatus st = null;
        if (status != null) {
            try { st = FileEntity.FileStatus.valueOf(status); } catch (IllegalArgumentException ignore) {}
        }
        var page = fileService.getUserFiles(uploadedBy, st, pageable);
        var content = page.getContent().stream().map(this::toDto).toList();
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    public List<FileInfoResponse> getBatchFileInfo(List<UUID> fileIds) {
        return fileService.getBatchFileInfo(fileIds).stream().map(this::toDto).toList();
    }

    @Override
    public ValidateTypeResponse validateType(ValidateTypeRequest req) {
        // TODO: 从岗位表单模板获取 allowedTypes；当前先允许常见类型
        var allowed = List.of("pdf","doc","docx","jpg","jpeg","png");
        boolean ok = fileService.validateFileType(req.fileName(), req.contentType(), allowed);
        return new ValidateTypeResponse(ok, ok ? "文件类型有效" : "不支持的文件类型", allowed, "10MB");
    }

    @Override
    public ScanStatusResponse triggerScan(UUID fileId) {
        var e = fileRepository.findById(fileId).orElseThrow(() -> new RuntimeException("File not found: " + fileId));
        e.setVirusScanStatus(FileEntity.VirusScanStatus.SCANNING);
        e.setVirusScanResult(null);
        fileRepository.save(e);
        return new ScanStatusResponse(fileId, e.getVirusScanStatus().name(), e.getVirusScanResult(), null);
    }

    @Override
    public ScanStatusResponse getScanResult(UUID fileId) {
        var e = fileRepository.findById(fileId).orElseThrow(() -> new RuntimeException("File not found: " + fileId));
        LocalDateTime scannedAt = null;
        if (e.getVirusScanStatus() == FileEntity.VirusScanStatus.CLEAN || e.getVirusScanStatus() == FileEntity.VirusScanStatus.INFECTED) {
            scannedAt = e.getUpdatedAt();
        }
        return new ScanStatusResponse(fileId, e.getVirusScanStatus().name(), e.getVirusScanResult(), scannedAt);
    }

    private FileInfoResponse toDto(FileEntity e) {
        return new FileInfoResponse(
                e.getId(),
                e.getStoredName(),
                e.getOriginalName(),
                e.getContentType(),
                e.getFileSize(),
                e.getStatus().name(),
                e.getVirusScanStatus().name(),
                e.getFieldKey(),
                e.getApplicationId(),
                e.getUploadedBy(),
                e.getCreatedAt(),
                e.getLastAccessedAt(),
                e.getAccessCount()
        );
    }
}

