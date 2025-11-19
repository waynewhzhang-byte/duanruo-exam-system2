package com.duanruo.exam.domain.exam;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 考试ID值对象
 */
public class ExamId extends BaseId {
    
    public ExamId(UUID value) {
        super(value);
    }
    
    public ExamId(String value) {
        super(value);
    }
    
    public static ExamId newExamId() {
        return new ExamId(newId());
    }
    
    public static ExamId of(UUID value) {
        return new ExamId(value);
    }
    
    public static ExamId of(String value) {
        return new ExamId(value);
    }
}
