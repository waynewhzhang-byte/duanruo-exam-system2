package com.duanruo.exam.domain.exam;

import java.util.List;
import java.util.Optional;

/**
 * 科目仓储端口（Domain Port）
 */
public interface SubjectRepository {

    void save(Subject subject);

    Optional<Subject> findById(SubjectId id);

    List<Subject> findByPositionId(PositionId positionId);

    void delete(SubjectId id);

    void deleteByPositionId(PositionId positionId);
}

