package com.duanruo.exam.domain.application;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 报名申请ID值对象
 */
public class ApplicationId extends BaseId {
    
    public ApplicationId(UUID value) {
        super(value);
    }
    
    public ApplicationId(String value) {
        super(value);
    }
    
    public static ApplicationId newApplicationId() {
        return new ApplicationId(newId());
    }
    
    public static ApplicationId of(UUID value) {
        return new ApplicationId(value);
    }
    
    public static ApplicationId of(String value) {
        return new ApplicationId(value);
    }
}
