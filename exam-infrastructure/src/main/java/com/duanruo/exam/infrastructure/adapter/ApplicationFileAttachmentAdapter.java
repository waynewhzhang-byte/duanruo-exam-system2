package com.duanruo.exam.infrastructure.adapter;

import com.duanruo.exam.application.port.ApplicationFileAttachmentPort;
import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaFileRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ApplicationFileAttachmentAdapter implements ApplicationFileAttachmentPort {

    private final JpaFileRepository fileRepository;

    public ApplicationFileAttachmentAdapter(JpaFileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    @Override
    public void associate(UUID fileId, UUID applicationId, String fieldKey) {
        var f = fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("file not found: " + fileId));
        f.setApplicationId(applicationId);
        if (fieldKey != null) f.setFieldKey(fieldKey);
        f.setStatus(FileEntity.FileStatus.AVAILABLE);
        fileRepository.save(f);
    }
}

