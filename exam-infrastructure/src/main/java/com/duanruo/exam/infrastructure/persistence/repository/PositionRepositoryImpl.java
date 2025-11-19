package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.exam.*;
import com.duanruo.exam.infrastructure.persistence.entity.PositionEntity;
import com.duanruo.exam.infrastructure.persistence.mapper.PositionMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class PositionRepositoryImpl implements PositionRepository {

    private final JpaPositionRepository jpa;
    private final PositionMapper mapper;

    public PositionRepositoryImpl(JpaPositionRepository jpa, PositionMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    public void save(Position position) {
        PositionEntity entity = mapper.toEntity(position);
        jpa.save(entity);
    }

    @Override
    public Optional<Position> findById(PositionId id) {
        return jpa.findById(id.getValue()).map(mapper::toDomain);
    }

    @Override
    public List<Position> findByExamId(ExamId examId) {
        return jpa.findByExamId(examId.getValue()).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Position> findByExamIdAndCode(ExamId examId, String code) {
        return jpa.findByExamIdAndCode(examId.getValue(), code).map(mapper::toDomain);
    }

    @Override
    public boolean existsByExamIdAndCode(ExamId examId, String code) {
        return jpa.existsByExamIdAndCode(examId.getValue(), code);
    }

    @Override
    public void delete(PositionId id) {
        jpa.deleteById(id.getValue());
    }

    @Override
    public void deleteByExamId(ExamId examId) {
        jpa.deleteByExamId(examId.getValue());
    }
}

