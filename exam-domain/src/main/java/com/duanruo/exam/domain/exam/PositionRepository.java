package com.duanruo.exam.domain.exam;

import java.util.List;
import java.util.Optional;

/**
 * 岗位仓储端口（Domain Port）
 */
public interface PositionRepository {

    void save(Position position);

    Optional<Position> findById(PositionId id);

    List<Position> findByExamId(ExamId examId);

    Optional<Position> findByExamIdAndCode(ExamId examId, String code);

    boolean existsByExamIdAndCode(ExamId examId, String code);

    void delete(PositionId id);

    void deleteByExamId(ExamId examId);
}

