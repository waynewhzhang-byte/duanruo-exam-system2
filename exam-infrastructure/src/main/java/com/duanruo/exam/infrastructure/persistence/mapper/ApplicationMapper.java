package com.duanruo.exam.infrastructure.persistence.mapper;

import com.duanruo.exam.domain.application.Application;
import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.infrastructure.persistence.entity.ApplicationEntity;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import java.util.Objects;

/**
 * 报名申请 领域对象 <-> JPA 实体 映射器
 */
@Component
public class ApplicationMapper {

    private final ObjectMapper jsonMapper = JsonMapper.builder().build();

    /**
     * 领域 -> 实体
     */
    public ApplicationEntity toEntity(Application domain) {
        Objects.requireNonNull(domain, "application domain must not be null");
        ApplicationEntity entity = new ApplicationEntity(
                domain.getId().getValue(),
                domain.getExamId().getValue(),
                domain.getPositionId().getValue(),
                domain.getCandidateId().getValue()
        );
        entity.setFormVersion(domain.getFormVersion());
        try {
            entity.setPayload(domain.getPayload() == null ? null : jsonMapper.readTree(domain.getPayload()));
        } catch (Exception e) {
            entity.setPayload(null);
        }
        entity.setStatus(mapToEntityStatus(domain.getStatus()));
        try {
            entity.setAutoCheckResult(domain.getAutoCheckResult() == null ? null : jsonMapper.readTree(domain.getAutoCheckResult()));
        } catch (Exception e) {
            entity.setAutoCheckResult(null);
        }
        try {
            entity.setFinalDecision(domain.getFinalDecision() == null ? null : jsonMapper.readTree(domain.getFinalDecision()));
        } catch (Exception e) {
            entity.setFinalDecision(null);
        }
        entity.setSubmittedAt(domain.getSubmittedAt());
        entity.setStatusUpdatedAt(domain.getStatusUpdatedAt());
        entity.setVersion(domain.getVersion());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        return entity;
    }

    /**
     * 实体 -> 领域
     */
    public Application toDomain(ApplicationEntity entity) {
        Objects.requireNonNull(entity, "application entity must not be null");
        return Application.rebuild(
                ApplicationId.of(entity.getId()),
                ExamId.of(entity.getExamId()),
                PositionId.of(entity.getPositionId()),
                CandidateId.of(entity.getCandidateId()),
                entity.getFormVersion(),
                safeWrite(entity.getPayload()),
                mapToDomainStatus(entity.getStatus()),
                safeWrite(entity.getAutoCheckResult()),
                safeWrite(entity.getFinalDecision()),
                entity.getSubmittedAt(),
                entity.getStatusUpdatedAt(),
                entity.getVersion(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public ApplicationEntity.ApplicationStatusEntity mapToEntityStatus(ApplicationStatus status) {
        if (status == null) return null;
        return switch (status) {
            case DRAFT -> ApplicationEntity.ApplicationStatusEntity.DRAFT;
            case SUBMITTED -> ApplicationEntity.ApplicationStatusEntity.SUBMITTED;
            case AUTO_REJECTED -> ApplicationEntity.ApplicationStatusEntity.AUTO_REJECTED;
            case AUTO_PASSED -> ApplicationEntity.ApplicationStatusEntity.AUTO_PASSED;
            case PENDING_PRIMARY_REVIEW -> ApplicationEntity.ApplicationStatusEntity.PENDING_PRIMARY_REVIEW;
            case PRIMARY_REJECTED -> ApplicationEntity.ApplicationStatusEntity.PRIMARY_REJECTED;
            case PRIMARY_PASSED -> ApplicationEntity.ApplicationStatusEntity.PRIMARY_PASSED;
            case PENDING_SECONDARY_REVIEW -> ApplicationEntity.ApplicationStatusEntity.PENDING_SECONDARY_REVIEW;
            case SECONDARY_REJECTED -> ApplicationEntity.ApplicationStatusEntity.SECONDARY_REJECTED;
            case APPROVED -> ApplicationEntity.ApplicationStatusEntity.APPROVED;
            case PAID -> ApplicationEntity.ApplicationStatusEntity.PAID;
            case TICKET_ISSUED -> ApplicationEntity.ApplicationStatusEntity.TICKET_ISSUED;
            case WRITTEN_EXAM_COMPLETED -> ApplicationEntity.ApplicationStatusEntity.WRITTEN_EXAM_COMPLETED;
            case WRITTEN_EXAM_FAILED -> ApplicationEntity.ApplicationStatusEntity.WRITTEN_EXAM_FAILED;
            case INTERVIEW_ELIGIBLE -> ApplicationEntity.ApplicationStatusEntity.INTERVIEW_ELIGIBLE;
            case INTERVIEW_COMPLETED -> ApplicationEntity.ApplicationStatusEntity.INTERVIEW_COMPLETED;
            case FINAL_ACCEPTED -> ApplicationEntity.ApplicationStatusEntity.FINAL_ACCEPTED;
            case FINAL_REJECTED -> ApplicationEntity.ApplicationStatusEntity.FINAL_REJECTED;
            case WITHDRAWN -> ApplicationEntity.ApplicationStatusEntity.WITHDRAWN;
            case EXPIRED -> ApplicationEntity.ApplicationStatusEntity.EXPIRED;
            default -> throw new IllegalStateException("Unknown ApplicationStatus: " + status);
        };
    }

    public ApplicationStatus mapToDomainStatus(ApplicationEntity.ApplicationStatusEntity status) {
        if (status == null) return null;
        return switch (status) {
            case DRAFT -> ApplicationStatus.DRAFT;
            case SUBMITTED -> ApplicationStatus.SUBMITTED;
            case AUTO_REJECTED -> ApplicationStatus.AUTO_REJECTED;
            case AUTO_PASSED -> ApplicationStatus.AUTO_PASSED;
            case PENDING_PRIMARY_REVIEW -> ApplicationStatus.PENDING_PRIMARY_REVIEW;
            case PRIMARY_REJECTED -> ApplicationStatus.PRIMARY_REJECTED;
            case PRIMARY_PASSED -> ApplicationStatus.PRIMARY_PASSED;
            case PENDING_SECONDARY_REVIEW -> ApplicationStatus.PENDING_SECONDARY_REVIEW;
            case SECONDARY_REJECTED -> ApplicationStatus.SECONDARY_REJECTED;
            case APPROVED -> ApplicationStatus.APPROVED;
            case PAID -> ApplicationStatus.PAID;
            case TICKET_ISSUED -> ApplicationStatus.TICKET_ISSUED;
            case WRITTEN_EXAM_COMPLETED -> ApplicationStatus.WRITTEN_EXAM_COMPLETED;
            case WRITTEN_EXAM_FAILED -> ApplicationStatus.WRITTEN_EXAM_FAILED;
            case INTERVIEW_ELIGIBLE -> ApplicationStatus.INTERVIEW_ELIGIBLE;
            case INTERVIEW_COMPLETED -> ApplicationStatus.INTERVIEW_COMPLETED;
            case FINAL_ACCEPTED -> ApplicationStatus.FINAL_ACCEPTED;
            case FINAL_REJECTED -> ApplicationStatus.FINAL_REJECTED;
            case WITHDRAWN -> ApplicationStatus.WITHDRAWN;
            case EXPIRED -> ApplicationStatus.EXPIRED;
            default -> throw new IllegalStateException("Unknown ApplicationStatusEntity: " + status);
        };
    }

    private String safeWrite(com.fasterxml.jackson.databind.JsonNode node) {
        try {
            return node == null ? null : jsonMapper.writeValueAsString(node);
        } catch (Exception e) {
            return null;
        }
    }
}

