package com.duanruo.exam.infrastructure.persistence.mapper;

import com.duanruo.exam.domain.exam.*;
import com.duanruo.exam.infrastructure.persistence.entity.PositionEntity;
import org.springframework.stereotype.Component;

/**
 * 岗位领域对象与实体映射器
 */
@Component
public class PositionMapper {

    /**
     * 领域对象转实体
     */
    public PositionEntity toEntity(Position position) {
        PositionEntity entity = new PositionEntity();
        entity.setId(position.getId().getValue());
        entity.setExamId(position.getExamId().getValue());
        entity.setCode(position.getCode());
        entity.setTitle(position.getTitle());
        entity.setDescription(position.getDescription());
        entity.setRequirements(position.getRequirements());
        entity.setQuota(position.getQuota());
        entity.setSeatRuleId(position.getSeatRuleId() != null ?
                            java.util.UUID.fromString(position.getSeatRuleId()) : null);

        return entity;
    }

    /**
     * 实体转领域对象
     */
    public Position toDomain(PositionEntity entity) {
        Position position = Position.rebuild(
                PositionId.of(entity.getId()),
                ExamId.of(entity.getExamId()),
                entity.getCode(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getRequirements(),
                entity.getQuota(),
                entity.getSeatRuleId() != null ? entity.getSeatRuleId().toString() : null
        );

        return position;
    }
}
