package com.duanruo.exam.infrastructure.adapter;

import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaFileRepository;
import com.duanruo.exam.infrastructure.service.FileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class FileServiceImplIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("exam_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private FileServiceImpl fileService;

    @Autowired
    private JpaFileRepository fileRepository;

    @BeforeEach
    void setUp() {
        fileRepository.deleteAll();
    }

    @Test
    void shouldCreateAndRetrieveFileInfo() {
        // Create test file
        var file = createTestFile("resume.pdf", "candidate1", FileEntity.FileStatus.AVAILABLE);

        // Retrieve file info
        var fileInfo = fileService.getFileInfo(file.getId());

        assertThat(fileInfo).isPresent();
        assertThat(fileInfo.get().getStoredName()).isEqualTo("resume.pdf");
        assertThat(fileInfo.get().getUploadedBy()).isEqualTo("candidate1");
        assertThat(fileInfo.get().getStatus()).isEqualTo(FileEntity.FileStatus.AVAILABLE);
    }

    @Test
    void shouldGetUserFiles() {
        // Create test files
        var file1 = createTestFile("resume.pdf", "candidate1", FileEntity.FileStatus.AVAILABLE);
        var file2 = createTestFile("diploma.pdf", "candidate1", FileEntity.FileStatus.AVAILABLE);
        var file3 = createTestFile("other.pdf", "candidate2", FileEntity.FileStatus.AVAILABLE);

        // Get files for candidate1
        var result = fileService.getUserFiles("candidate1", null, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent())
                .extracting(FileEntity::getStoredName)
                .containsExactlyInAnyOrder("resume.pdf", "diploma.pdf");
    }

    @Test
    void shouldGetUserFilesWithStatusFilter() {
        // Create test files with different statuses
        var file1 = createTestFile("resume.pdf", "candidate1", FileEntity.FileStatus.AVAILABLE);
        var file2 = createTestFile("diploma.pdf", "candidate1", FileEntity.FileStatus.DELETED);

        // Get only available files
        var result = fileService.getUserFiles("candidate1", FileEntity.FileStatus.AVAILABLE, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getStoredName()).isEqualTo("resume.pdf");
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(FileEntity.FileStatus.AVAILABLE);
    }

    @Test
    void shouldGetBatchFileInfo() {
        // Create test files
        var file1 = createTestFile("resume.pdf", "candidate1", FileEntity.FileStatus.AVAILABLE);
        var file2 = createTestFile("diploma.pdf", "candidate1", FileEntity.FileStatus.AVAILABLE);

        // Get batch info
        var fileIds = List.of(file1.getId(), file2.getId());
        var result = fileService.getBatchFileInfo(fileIds);

        assertThat(result).hasSize(2);
        assertThat(result)
                .extracting(FileEntity::getStoredName)
                .containsExactlyInAnyOrder("resume.pdf", "diploma.pdf");
    }

    @Test
    void shouldValidateFileType() {
        var allowedTypes = List.of("pdf", "doc", "docx", "jpg", "jpeg", "png");

        assertThat(fileService.validateFileType("resume.pdf", "application/pdf", allowedTypes)).isTrue();
        assertThat(fileService.validateFileType("document.doc", "application/msword", allowedTypes)).isTrue();
        assertThat(fileService.validateFileType("image.jpg", "image/jpeg", allowedTypes)).isTrue();
        assertThat(fileService.validateFileType("malware.exe", "application/octet-stream", allowedTypes)).isFalse();
    }

    @Test
    void shouldConfirmUpload() {
        // Create pending file
        var file = createTestFile("resume.pdf", "candidate1", FileEntity.FileStatus.UPLOADING);

        // Confirm upload
        fileService.confirmUpload(file.getId(), 1024000L);

        // Verify status updated
        var updatedFile = fileRepository.findById(file.getId()).orElseThrow();
        assertThat(updatedFile.getStatus()).isEqualTo(FileEntity.FileStatus.UPLOADED);
        assertThat(updatedFile.getFileSize()).isEqualTo(1024000L);
    }

    @Test
    void shouldDeleteFile() {
        // Create available file
        var file = createTestFile("resume.pdf", "candidate1", FileEntity.FileStatus.AVAILABLE);

        // Delete file
        fileService.deleteFile(file.getId(), "candidate1");

        // Verify status updated
        var updatedFile = fileRepository.findById(file.getId()).orElseThrow();
        assertThat(updatedFile.getStatus()).isEqualTo(FileEntity.FileStatus.DELETED);
    }

    private FileEntity createTestFile(String fileName, String uploadedBy, FileEntity.FileStatus status) {
        var file = new FileEntity();
        file.setId(UUID.randomUUID());
        file.setStoredName(fileName);
        file.setOriginalName(fileName);
        file.setContentType("application/pdf");
        file.setFileSize(1024000L);
        file.setStatus(status);
        file.setVirusScanStatus(FileEntity.VirusScanStatus.PENDING);
        file.setFieldKey("resume");
        file.setUploadedBy(uploadedBy);
        file.setCreatedAt(LocalDateTime.now());
        file.setUpdatedAt(LocalDateTime.now());
        file.setAccessCount(0);
        return fileRepository.save(file);
    }
}
