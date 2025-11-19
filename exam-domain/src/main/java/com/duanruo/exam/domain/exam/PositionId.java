package com.duanruo.exam.domain.exam;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 岗位ID值对象
 */
public class PositionId extends BaseId {
    
    public PositionId(UUID value) {
        super(value);
    }
    
    public PositionId(String value) {
        super(value);
    }
    
    public static PositionId newPositionId() {
        return new PositionId(newId());
    }
    
    public static PositionId of(UUID value) {
        return new PositionId(value);
    }
    
    public static PositionId of(String value) {
        return new PositionId(value);
    }
}
