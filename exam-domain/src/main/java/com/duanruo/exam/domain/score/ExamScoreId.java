package com.duanruo.exam.domain.score;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 考试成绩ID值对象
 */
public class ExamScoreId extends BaseId {

    public ExamScoreId(UUID value) {
        super(value);
    }

    public ExamScoreId(String value) {
        super(value);
    }

    public static ExamScoreId newExamScoreId() {
        return new ExamScoreId(newId());
    }

    public static ExamScoreId of(UUID value) {
        return new ExamScoreId(value);
    }

    public static ExamScoreId of(String value) {
        return new ExamScoreId(value);
    }
}
