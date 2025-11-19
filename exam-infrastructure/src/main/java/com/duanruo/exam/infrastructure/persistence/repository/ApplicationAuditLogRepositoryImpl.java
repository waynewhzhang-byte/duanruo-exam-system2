package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.application.ApplicationAuditLogRepository;
import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.infrastructure.persistence.entity.ApplicationAuditLogEntity;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.Collection;

@Repository
public class ApplicationAuditLogRepositoryImpl implements ApplicationAuditLogRepository {

    private final JpaApplicationAuditLogRepository jpa;
    private final ObjectMapper jsonMapper = JsonMapper.builder().build();

    public ApplicationAuditLogRepositoryImpl(JpaApplicationAuditLogRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void record(ApplicationId applicationId, ApplicationStatus from, ApplicationStatus to,
                       String actor, String reason, String metadata, LocalDateTime at) {
        ApplicationAuditLogEntity e = new ApplicationAuditLogEntity();
        e.setApplicationId(applicationId.getValue());
        e.setFromStatus(from);
        e.setToStatus(to);
        e.setActor(actor);
        e.setReason(reason);
        try {
            e.setMetadata(metadata == null ? null : jsonMapper.readTree(metadata));
        } catch (Exception ex) {
            e.setMetadata(null);
        }
        // createdAt uses @CreationTimestamp; ignore at if null
        jpa.save(e);
    }

    @Override
    public java.util.List<com.duanruo.exam.domain.application.ApplicationAuditLogRecord> listByApplication(ApplicationId applicationId) {
        return jpa.findByApplicationIdOrderByCreatedAtAsc(applicationId.getValue()).stream()
                .map(e -> new com.duanruo.exam.domain.application.ApplicationAuditLogRecord(
                        e.getId(),
                        ApplicationId.of(e.getApplicationId()),
                        e.getFromStatus(),
                        e.getToStatus(),
                        e.getActor(),
                        e.getReason(),
                        safeWrite(e.getMetadata()),
                        e.getCreatedAt()
                ))
                .toList();
    }

    private String safeWrite(com.fasterxml.jackson.databind.JsonNode node) {
        try {
            return node == null ? null : jsonMapper.writeValueAsString(node);
        } catch (Exception ex) {
            return null;
        }
    }

    @Override
    public long countByActorAndToStatusInBetween(String actor, Collection<ApplicationStatus> toStatuses,
                                                 LocalDateTime startInclusive, LocalDateTime endExclusive) {
        return jpa.countProcessedByActorBetween(actor, toStatuses, startInclusive, endExclusive);
    }
}

