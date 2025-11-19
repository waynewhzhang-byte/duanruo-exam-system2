package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.file.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface FileApplicationService {
    FileUploadUrlResponse generateUploadUrl(FileUploadUrlRequest req, String uploadedBy);
    void confirmUpload(UUID fileId, long fileSize);
    FileInfoResponse getFile(UUID fileId);
    PresignedUrlResponse getDownloadUrl(UUID fileId, String requestedBy);
    void deleteFile(UUID fileId, String deletedBy);
    Page<FileInfoResponse> getMyFiles(String uploadedBy, String status, Pageable pageable);
    List<FileInfoResponse> getBatchFileInfo(List<UUID> fileIds);
    ValidateTypeResponse validateType(ValidateTypeRequest req);
    ScanStatusResponse triggerScan(UUID fileId);
    ScanStatusResponse getScanResult(UUID fileId);
}

