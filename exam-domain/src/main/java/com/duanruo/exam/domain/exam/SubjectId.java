package com.duanruo.exam.domain.exam;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 科目ID值对象
 */
public class SubjectId extends BaseId {
    
    public SubjectId(UUID value) {
        super(value);
    }
    
    public SubjectId(String value) {
        super(value);
    }
    
    public static SubjectId newSubjectId() {
        return new SubjectId(newId());
    }
    
    public static SubjectId of(UUID value) {
        return new SubjectId(value);
    }
    
    public static SubjectId of(String value) {
        return new SubjectId(value);
    }
}
