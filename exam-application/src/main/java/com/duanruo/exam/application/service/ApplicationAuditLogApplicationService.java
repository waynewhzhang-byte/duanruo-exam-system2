package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.ApplicationAuditLogItemResponse;
import com.duanruo.exam.domain.application.ApplicationAuditLogRecord;
import com.duanruo.exam.domain.application.ApplicationAuditLogRepository;
import com.duanruo.exam.domain.application.ApplicationId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ApplicationAuditLogApplicationService {

    private final ApplicationAuditLogRepository auditLogRepository;

    public ApplicationAuditLogApplicationService(ApplicationAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<ApplicationAuditLogItemResponse> list(UUID applicationId) {
        var records = auditLogRepository.listByApplication(ApplicationId.of(applicationId));
        return records.stream().map(this::toDto).toList();
    }

    private ApplicationAuditLogItemResponse toDto(ApplicationAuditLogRecord r) {
        return new ApplicationAuditLogItemResponse(
                r.getId(),
                r.getApplicationId().getValue(),
                r.getFrom() == null ? null : r.getFrom().name(),
                r.getTo() == null ? null : r.getTo().name(),
                r.getActor(),
                r.getReason(),
                r.getMetadata(),
                r.getCreatedAt()
        );
    }
}

