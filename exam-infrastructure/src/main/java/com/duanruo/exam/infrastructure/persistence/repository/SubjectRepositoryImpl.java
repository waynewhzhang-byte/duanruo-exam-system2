package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.exam.*;
import com.duanruo.exam.infrastructure.persistence.entity.SubjectEntity;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class SubjectRepositoryImpl implements SubjectRepository {

    private final JpaSubjectRepository jpa;
    private final ObjectMapper jsonMapper = JsonMapper.builder().build();

    public SubjectRepositoryImpl(JpaSubjectRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(Subject subject) {
        SubjectEntity e = toEntity(subject);
        jpa.save(e);
    }

    @Override
    public Optional<Subject> findById(SubjectId id) {
        return jpa.findById(id.getValue()).map(this::toDomain);
    }

    @Override
    public List<Subject> findByPositionId(PositionId positionId) {
        return jpa.findByPositionId(positionId.getValue()).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(SubjectId id) {
        jpa.deleteById(id.getValue());
    }

    @Override
    public void deleteByPositionId(PositionId positionId) {
        jpa.deleteByPositionId(positionId.getValue());
    }

    private SubjectEntity toEntity(Subject s) {
        SubjectEntity e = new SubjectEntity();
        e.setId(s.getId().getValue());
        e.setPositionId(s.getPositionId().getValue());
        e.setName(s.getName());
        e.setDurationMinutes(s.getDurationMinutes());
        e.setType(mapTypeToEntity(s.getType()));
        e.setMaxScore(s.getMaxScore());
        e.setPassingScore(s.getPassingScore());
        e.setWeight(s.getWeight());
        e.setOrdering(s.getOrdering());
        try { e.setSchedule(s.getSchedule() == null ? null : jsonMapper.readTree(s.getSchedule())); }
        catch (Exception ex) { e.setSchedule(null); }
        return e;
    }

    private Subject toDomain(SubjectEntity e) {
        String schedule = null;
        try { schedule = e.getSchedule() == null ? null : jsonMapper.writeValueAsString(e.getSchedule()); }
        catch (Exception ex) { schedule = null; }
        return Subject.rebuild(
                SubjectId.of(e.getId()),
                PositionId.of(e.getPositionId()),
                e.getName(),
                e.getDurationMinutes(),
                mapTypeToDomain(e.getType()),
                e.getMaxScore(),
                e.getPassingScore(),
                e.getWeight(),
                e.getOrdering(),
                schedule
        );
    }

    private SubjectEntity.SubjectTypeEntity mapTypeToEntity(SubjectType t) {
        return switch (t) {
            case WRITTEN -> SubjectEntity.SubjectTypeEntity.WRITTEN;
            case INTERVIEW -> SubjectEntity.SubjectTypeEntity.INTERVIEW;
            case PRACTICAL -> SubjectEntity.SubjectTypeEntity.PRACTICAL;
        };
    }

    private SubjectType mapTypeToDomain(SubjectEntity.SubjectTypeEntity t) {
        return switch (t) {
            case WRITTEN -> SubjectType.WRITTEN;
            case INTERVIEW -> SubjectType.INTERVIEW;
            case PRACTICAL -> SubjectType.PRACTICAL;
        };
    }
}

