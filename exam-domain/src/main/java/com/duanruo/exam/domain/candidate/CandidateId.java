package com.duanruo.exam.domain.candidate;

import com.duanruo.exam.shared.valueobject.BaseId;

import java.util.UUID;

/**
 * 候选人ID值对象
 */
public class CandidateId extends BaseId {
    
    public CandidateId(UUID value) {
        super(value);
    }
    
    public CandidateId(String value) {
        super(value);
    }
    
    public static CandidateId newCandidateId() {
        return new CandidateId(newId());
    }
    
    public static CandidateId of(UUID value) {
        return new CandidateId(value);
    }
    
    public static CandidateId of(String value) {
        return new CandidateId(value);
    }
}
