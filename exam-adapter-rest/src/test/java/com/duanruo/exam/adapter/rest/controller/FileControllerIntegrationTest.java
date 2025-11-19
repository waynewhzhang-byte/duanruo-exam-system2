package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.security.WithMockUserWithPermissions;
import com.duanruo.exam.application.dto.file.*;
import com.duanruo.exam.application.service.FileApplicationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FileController.class)
class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FileApplicationService fileService;

    @MockBean
    private com.duanruo.exam.application.service.JwtTokenService jwtTokenService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 生成确定性的 UUID（与 WithMockUserWithPermissionsSecurityContextFactory 中的逻辑一致）
     */
    private UUID generateDeterministicUUID(String name) {
        UUID namespace = UUID.fromString("6ba7b810-9dad-11d1-80b4-00c04fd430c8");

        try {
            byte[] nameBytes = name.getBytes("UTF-8");
            byte[] namespaceBytes = toBytes(namespace);

            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
            md.update(namespaceBytes);
            md.update(nameBytes);
            byte[] hash = md.digest();

            hash[6] &= 0x0f;
            hash[6] |= 0x50;
            hash[8] &= 0x3f;
            hash[8] |= 0x80;

            long msb = 0;
            long lsb = 0;
            for (int i = 0; i < 8; i++) {
                msb = (msb << 8) | (hash[i] & 0xff);
            }
            for (int i = 8; i < 16; i++) {
                lsb = (lsb << 8) | (hash[i] & 0xff);
            }

            return new UUID(msb, lsb);
        } catch (Exception e) {
            return new UUID(0, name.hashCode());
        }
    }

    private byte[] toBytes(UUID uuid) {
        byte[] bytes = new byte[16];
        long msb = uuid.getMostSignificantBits();
        long lsb = uuid.getLeastSignificantBits();
        for (int i = 0; i < 8; i++) {
            bytes[i] = (byte) (msb >>> (8 * (7 - i)));
        }
        for (int i = 8; i < 16; i++) {
            bytes[i] = (byte) (lsb >>> (8 * (7 - i)));
        }
        return bytes;
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldGenerateUploadUrl() throws Exception {
        // Given
        var request = new FileUploadUrlRequest("resume.pdf", "application/pdf", "resume");
        var response = new FileUploadUrlResponse(
                UUID.randomUUID(),
                "https://minio.example.com/upload-url",
                "uploads/candidate1/resume.pdf",
                "resume.pdf",
                "application/pdf",
                "resume",
                3600
        );
        UUID userId = generateDeterministicUUID("candidate1");
        when(fileService.generateUploadUrl(any(FileUploadUrlRequest.class), eq(userId.toString())))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/files/upload-url")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(response.fileId().toString()))
                .andExpect(jsonPath("$.uploadUrl").value(response.uploadUrl()))
                .andExpect(jsonPath("$.fileName").value("resume.pdf"))
                .andExpect(jsonPath("$.contentType").value("application/pdf"))
                .andExpect(jsonPath("$.fieldKey").value("resume"))
                .andExpect(jsonPath("$.expiresIn").value(3600));
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldConfirmUpload() throws Exception {
        // Given
        UUID fileId = UUID.randomUUID();
        var request = new FileUploadConfirmRequest("resume.pdf", 1024000L, "application/pdf");
        var fileInfo = new FileInfoResponse(
                fileId, "resume.pdf", "resume.pdf", "application/pdf", 1024000L,
                "UPLOADED", "PENDING", "resume", null, "candidate1",
                LocalDateTime.now(), null, 0
        );

        when(fileService.getFile(fileId)).thenReturn(fileInfo);

        // When & Then
        mockMvc.perform(post("/files/{fileId}/confirm", fileId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(fileId.toString()))
                .andExpect(jsonPath("$.status").value("UPLOADED"))
                .andExpect(jsonPath("$.fileName").value("resume.pdf"))
                .andExpect(jsonPath("$.fileSize").value(1024000))
                .andExpect(jsonPath("$.virusScanStatus").value("PENDING"))
                .andExpect(jsonPath("$.message").value("文件上传确认成功"));
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldGetFileInfo() throws Exception {
        // Given
        UUID fileId = UUID.randomUUID();
        var fileInfo = new FileInfoResponse(
                fileId, "resume.pdf", "resume.pdf", "application/pdf", 1024000L,
                "AVAILABLE", "CLEAN", "resume", null, "candidate1",
                LocalDateTime.now(), LocalDateTime.now(), 3
        );
        when(fileService.getFile(fileId)).thenReturn(fileInfo);

        // When & Then
        mockMvc.perform(get("/files/{fileId}", fileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(fileId.toString()))
                .andExpect(jsonPath("$.fileName").value("resume.pdf"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.virusScanStatus").value("CLEAN"))
                .andExpect(jsonPath("$.uploadedBy").value("candidate1"))
                .andExpect(jsonPath("$.accessCount").value(3));
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldGetDownloadUrl() throws Exception {
        // Given
        UUID userId = generateDeterministicUUID("candidate1");
        UUID fileId = UUID.randomUUID();
        var response = new PresignedUrlResponse(
                fileId,
                "https://minio.example.com/download-url",
                1800,
                "resume.pdf",
                "application/pdf",
                1024000L
        );
        when(fileService.getDownloadUrl(fileId, userId.toString())).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/files/{fileId}/download-url", fileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(fileId.toString()))
                .andExpect(jsonPath("$.url").value(response.url()))
                .andExpect(jsonPath("$.expiresIn").value(1800))
                .andExpect(jsonPath("$.fileName").value("resume.pdf"))
                .andExpect(jsonPath("$.contentType").value("application/pdf"))
                .andExpect(jsonPath("$.fileSize").value(1024000));
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldDeleteFile() throws Exception {
        // Given
        UUID userId = generateDeterministicUUID("candidate1");
        UUID fileId = UUID.randomUUID();
        var fileInfo = new FileInfoResponse(
                fileId, "resume.pdf", "resume.pdf", "application/pdf", 1024000L,
                "DELETED", "CLEAN", "resume", null, "candidate1",
                LocalDateTime.now(), LocalDateTime.now(), 3
        );
        when(fileService.getFile(fileId)).thenReturn(fileInfo);

        // When & Then
        mockMvc.perform(delete("/files/{fileId}", fileId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(fileId.toString()))
                .andExpect(jsonPath("$.status").value("DELETED"))
                .andExpect(jsonPath("$.deletedBy").value(userId.toString()))
                .andExpect(jsonPath("$.message").value("文件删除成功"));
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldGetMyFiles() throws Exception {
        // Given
        UUID userId = generateDeterministicUUID("candidate1");
        var fileInfo = new FileInfoResponse(
                UUID.randomUUID(), "resume.pdf", "resume.pdf", "application/pdf", 1024000L,
                "AVAILABLE", "CLEAN", "resume", null, "candidate1",
                LocalDateTime.now(), null, 0
        );
        var page = new PageImpl<>(List.of(fileInfo), PageRequest.of(0, 20), 1);
        when(fileService.getMyFiles(eq(userId.toString()), isNull(), any())).thenReturn(page);

        // When & Then
        mockMvc.perform(get("/files/my")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.files").isArray())
                .andExpect(jsonPath("$.files[0].fileName").value("resume.pdf"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.currentPage").value(0))
                .andExpect(jsonPath("$.pageSize").value(20))
                .andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.hasPrevious").value(false));
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldValidateFileType() throws Exception {
        // Given
        var request = new ValidateTypeRequest("resume.pdf", "application/pdf", "resume");
        var response = new ValidateTypeResponse(
                true,
                "文件类型有效",
                List.of("pdf", "doc", "docx", "jpg", "jpeg", "png"),
                "10MB"
        );
        when(fileService.validateType(any(ValidateTypeRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/files/validate-type")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.reason").value("文件类型有效"))
                .andExpect(jsonPath("$.allowedTypes").isArray())
                .andExpect(jsonPath("$.maxSize").value("10MB"));
    }

    @Test
    @WithMockUserWithPermissions(username = "admin1", role = "ADMIN")
    void shouldTriggerScan() throws Exception {
        // Given
        UUID fileId = UUID.randomUUID();
        var response = new ScanStatusResponse(fileId, "SCANNING", null, null);
        when(fileService.triggerScan(fileId)).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/files/{fileId}/scan", fileId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(fileId.toString()))
                .andExpect(jsonPath("$.status").value("SCANNING"));
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldGetScanResult() throws Exception {
        // Given
        UUID fileId = UUID.randomUUID();
        var response = new ScanStatusResponse(fileId, "CLEAN", "No threats detected", LocalDateTime.now());
        when(fileService.getScanResult(fileId)).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/files/{fileId}/scan-result", fileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(fileId.toString()))
                .andExpect(jsonPath("$.status").value("CLEAN"))
                .andExpect(jsonPath("$.result").value("No threats detected"));
    }

    @Test
    @WithMockUserWithPermissions(username = "candidate1", role = "CANDIDATE")
    void shouldGetBatchFileInfo() throws Exception {
        // Given
        UUID userId = generateDeterministicUUID("candidate1");
        var fileInfo = new FileInfoResponse(
                UUID.randomUUID(), "resume.pdf", "resume.pdf", "application/pdf", 1024000L,
                "AVAILABLE", "CLEAN", "resume", null, "candidate1",
                LocalDateTime.now(), null, 0
        );
        var request = new FileBatchInfoRequest(List.of(fileInfo.fileId().toString()));
        when(fileService.getBatchFileInfo(any())).thenReturn(List.of(fileInfo));

        // When & Then
        mockMvc.perform(post("/files/batch-info")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.files").isArray())
                .andExpect(jsonPath("$.files[0].fileName").value("resume.pdf"))
                .andExpect(jsonPath("$.totalCount").value(1))
                .andExpect(jsonPath("$.requestedBy").value(userId.toString()));
    }
}
