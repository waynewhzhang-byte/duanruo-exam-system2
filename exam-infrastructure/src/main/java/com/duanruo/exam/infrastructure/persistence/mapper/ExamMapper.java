package com.duanruo.exam.infrastructure.persistence.mapper;

import com.duanruo.exam.domain.exam.*;
import com.duanruo.exam.infrastructure.persistence.entity.ExamEntity;
import com.duanruo.exam.infrastructure.persistence.entity.PositionEntity;
import org.springframework.stereotype.Component;

// Jackson for JSON conversion of rulesConfig
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 考试领域对象与实体映射器
 */
@Component
public class ExamMapper {

    private final PositionMapper positionMapper;
    private final ObjectMapper jsonMapper = JsonMapper.builder().build();

    public ExamMapper(PositionMapper positionMapper) {
        this.positionMapper = positionMapper;
    }

    /**
     * 领域对象转实体
     */
    public ExamEntity toEntity(Exam exam) {
        ExamEntity entity = new ExamEntity();
        entity.setId(exam.getId().getValue());
        entity.setCode(exam.getCode());
        entity.setSlug(exam.getSlug());
        entity.setTitle(exam.getTitle());
        entity.setDescription(exam.getDescription());
        entity.setAnnouncement(exam.getAnnouncement());
        entity.setRegistrationStart(exam.getRegistrationStart());
        entity.setRegistrationEnd(exam.getRegistrationEnd());
        entity.setExamStart(exam.getExamStart());
        entity.setExamEnd(exam.getExamEnd());
        entity.setFeeRequired(exam.isFeeRequired());
        entity.setFeeAmount(exam.getFeeAmount());
        entity.setTicketTemplate(exam.getTicketTemplate());
        entity.setFormTemplate(exam.getFormTemplate());
        entity.setStatus(mapToEntityStatus(exam.getStatus()));
        entity.setCreatedBy(UUID.fromString(exam.getCreatedBy()));
        entity.setCreatedAt(exam.getCreatedAt());
        entity.setUpdatedAt(exam.getUpdatedAt());
        // Map domain rulesConfig JSON string -> JsonNode for JSONB column
        if (exam.getRulesConfig() != null && !exam.getRulesConfig().isBlank()) {
            try {
                entity.setRulesConfig(jsonMapper.readTree(exam.getRulesConfig()));
            } catch (Exception e) {
                entity.setRulesConfig(null);
            }
        } else {
            entity.setRulesConfig(null);
        }

        return entity;
    }

    /**
     * 实体转领域对象
     */
    public Exam toDomain(ExamEntity entity, List<PositionEntity> positionEntities) {
        String rules = null;
        try {
            rules = entity.getRulesConfig() == null ? null : jsonMapper.writeValueAsString(entity.getRulesConfig());
        } catch (Exception e) {
            rules = null;
        }

        Exam exam = Exam.rebuildWithFormTemplateAndRules(
                ExamId.of(entity.getId()),
                entity.getCode(),
                entity.getSlug(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getAnnouncement(),
                entity.getRegistrationStart(),
                entity.getRegistrationEnd(),
                entity.getExamStart(),
                entity.getExamEnd(),
                entity.getFeeRequired() != null ? entity.getFeeRequired() : false,
                entity.getFeeAmount(),
                entity.getTicketTemplate(),
                entity.getFormTemplate(),
                mapToDomainStatus(entity.getStatus()),
                entity.getCreatedBy() != null ? entity.getCreatedBy().toString() : null,
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                rules
        );

        // 添加岗位（重建时使用不检查状态的方法）
        if (positionEntities != null) {
            List<Position> positions = positionEntities.stream()
                    .map(positionMapper::toDomain)
                    .collect(Collectors.toList());

            positions.forEach(exam::addPositionForRebuild);
        }

        return exam;
    }

    /**
     * 映射领域状态到实体状态
     */
    private ExamEntity.ExamStatusEntity mapToEntityStatus(ExamStatus status) {
        return switch (status) {
            case DRAFT -> ExamEntity.ExamStatusEntity.DRAFT;
            case OPEN -> ExamEntity.ExamStatusEntity.REGISTRATION_OPEN; // 数据库使用REGISTRATION_OPEN
            case CLOSED -> ExamEntity.ExamStatusEntity.CLOSED;
            case IN_PROGRESS -> ExamEntity.ExamStatusEntity.IN_PROGRESS;
            case COMPLETED -> ExamEntity.ExamStatusEntity.COMPLETED;
        };
    }

    /**
     * 映射实体状态到领域状态
     */
    private ExamStatus mapToDomainStatus(ExamEntity.ExamStatusEntity status) {
        return switch (status) {
            case DRAFT -> ExamStatus.DRAFT;
            case REGISTRATION_OPEN -> ExamStatus.OPEN; // 数据库的REGISTRATION_OPEN映射到领域的OPEN
            case OPEN -> ExamStatus.OPEN;
            case CLOSED -> ExamStatus.CLOSED;
            case IN_PROGRESS -> ExamStatus.IN_PROGRESS;
            case COMPLETED -> ExamStatus.COMPLETED;
        };
    }
}
