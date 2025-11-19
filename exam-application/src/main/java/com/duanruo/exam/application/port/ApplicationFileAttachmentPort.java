package com.duanruo.exam.application.port;

import java.util.UUID;

/**
 * 应用层端口：将文件与报名关联
 */
public interface ApplicationFileAttachmentPort {
    void associate(UUID fileId, UUID applicationId, String fieldKey);
}

