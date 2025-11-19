package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.FileApplicationService;
import com.duanruo.exam.application.dto.file.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 文件管理REST控制器
 * 实现文件上传、下载、管理等功能
 */
@RestController
@RequestMapping("/files")
@Tag(name = "文件管理", description = "文件上传、下载、管理等操作")
public class FileController {

    private final FileApplicationService fileService;

    public FileController(FileApplicationService fileService) {
        this.fileService = fileService;
    }

    @Operation(summary = "获取文件上传URL", description = "获取预签名的文件上传URL，用于直接上传到对象存储")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "500", description = "Internal Server Error", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/upload-url")
    @PreAuthorize("hasAuthority('FILE_UPLOAD')")
    public ResponseEntity<FileUploadUrlResponse> getUploadUrl(
            @RequestBody FileUploadUrlRequest uploadRequest,
            @CurrentUserId java.util.UUID userId) {

        // 根据PRD实现文件上传URL生成
        // When a candidate uploads supporting documents, the system shall persist the files to secure storage and associate them with the application.

        // 使用真实的文件服务生成上传URL
        FileUploadUrlResponse upload = fileService.generateUploadUrl(uploadRequest, userId.toString());
        return ResponseEntity.ok(upload);
    }

    @Operation(summary = "确认文件上传", description = "确认文件已成功上传到存储，更新文件状态")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "500", description = "Internal Server Error", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{fileId}/confirm")
    @PreAuthorize("hasAuthority('FILE_UPLOAD')")
    public ResponseEntity<FileUploadConfirmResponse> confirmUpload(
            @PathVariable("fileId") UUID fileId,
            @RequestBody FileUploadConfirmRequest confirmData) {

        // 使用真实的文件服务确认上传
        fileService.confirmUpload(fileId, confirmData.fileSize());

        var info = fileService.getFile(fileId);
        return ResponseEntity.ok(new FileUploadConfirmResponse(
            fileId,
            info.status(),
            info.originalName(),
            info.fileSize(),
            info.contentType(),
            info.virusScanStatus(),
            info.uploadedAt(),
            "文件上传确认成功"
        ));
    }

    @Operation(summary = "获取文件信息", description = "根据文件ID获取文件详细信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{fileId}")
    @PreAuthorize("hasAuthority('FILE_VIEW')")
    public ResponseEntity<FileInfoResponse> getFileInfo(@PathVariable("fileId") UUID fileId) {
        var info = fileService.getFile(fileId);
        return ResponseEntity.ok(info);
    }

    @Operation(summary = "获取文件下载URL", description = "获取预签名的文件下载URL")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{fileId}/download-url")
    @PreAuthorize("hasAuthority('FILE_VIEW')")
    public ResponseEntity<PresignedUrlResponse> getDownloadUrl(
            @PathVariable("fileId") UUID fileId,
            @CurrentUserId java.util.UUID userId) {
        var resp = fileService.getDownloadUrl(fileId, userId.toString());
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "删除文件", description = "删除指定文件")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasAuthority('FILE_DELETE')")
    public ResponseEntity<FileDeleteResponse> deleteFile(
            @PathVariable("fileId") UUID fileId,
            @CurrentUserId java.util.UUID userId) {
        fileService.deleteFile(fileId, userId.toString());
        var info = fileService.getFile(fileId);
        return ResponseEntity.ok(new FileDeleteResponse(
            fileId,
            info.status(),
            userId.toString(),
            "文件删除成功"
        ));
    }

    @Operation(summary = "触发病毒扫描", description = "手动触发文件病毒扫描")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/{fileId}/scan")
    @PreAuthorize("hasAuthority('FILE_SCAN')")
    public ResponseEntity<ScanStatusResponse> scanFile(@PathVariable("fileId") UUID fileId) {
        var resp = fileService.triggerScan(fileId);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "获取文件扫描结果", description = "获取文件病毒扫描结果")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{fileId}/scan-result")
    @PreAuthorize("hasAuthority('FILE_VIEW')")
    public ResponseEntity<ScanStatusResponse> getScanResult(@PathVariable("fileId") UUID fileId) {
        var resp = fileService.getScanResult(fileId);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "批量获取文件信息", description = "批量获取多个文件的信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/batch-info")
    @PreAuthorize("hasAuthority('FILE_VIEW')")
    public ResponseEntity<FileBatchInfoResponse> getBatchFileInfo(
            @RequestBody FileBatchInfoRequest request,
            @CurrentUserId java.util.UUID userId) {

        var infos = fileService.getBatchFileInfo(request.fileIds().stream().map(UUID::fromString).toList());
        return ResponseEntity.ok(new FileBatchInfoResponse(
            infos,
            infos.size(),
            userId.toString(),
            LocalDateTime.now()
        ));
    }

    @Operation(summary = "获取用户文件列表", description = "获取当前用户上传的所有文件")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('FILE_VIEW_OWN')")
    public ResponseEntity<FileListResponse> getMyFiles(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "status", required = false) String status,
            @CurrentUserId java.util.UUID userId) {
        var result = fileService.getMyFiles(userId.toString(), status, org.springframework.data.domain.PageRequest.of(page, size));
        return ResponseEntity.ok(new FileListResponse(
            result.getContent(),
            result.getTotalElements(),
            result.getTotalPages(),
            page,
            size,
            result.hasNext(),
            result.hasPrevious()
        ));
    }

    @Operation(summary = "文件类型验证", description = "验证文件类型是否符合要求")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/validate-type")
    @PreAuthorize("hasAuthority('FILE_UPLOAD')")
    public ResponseEntity<ValidateTypeResponse> validateFileType(
            @RequestBody ValidateTypeRequest validationRequest) {
        var resp = fileService.validateType(validationRequest);
        return ResponseEntity.ok(resp);
    }
}
